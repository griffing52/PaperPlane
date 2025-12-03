import boto3
import re
import os
from typing import List, Dict, Any, Optional, Tuple
from .base import OCRProcessor, OCRResult, FlightEntry

class AWSOCRProcessor(OCRProcessor):
    def __init__(self, region_name: str = "us-west-1"):
        self.client = boto3.client('textract', region_name=region_name, aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"), aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"))

    async def process_image(self, file_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
        try:
            textract_response = self.analyze_document(file_bytes)

            records = self._parse_textract_json(textract_response)
            
            if not records:
                 return OCRResult(
                    message="No valid flight records found in the image.",
                    records=[]
                )

            return OCRResult(
                message=f"Successfully processed {len(records)} flight records",
                records=records
            )
        except Exception as e:
            print(f"AWS Textract Processing Error: {e}")
            return OCRResult(
                message=f"Error processing image: {str(e)}",
                records=[]
            )

    def analyze_document(self, file_bytes: bytes) -> Dict[str, Any]:
        """
        Calls AWS Textract to analyze the document.
        Exposed for Hybrid processors to use.
        """
        return self.client.analyze_document(
            Document={'Bytes': file_bytes},
            FeatureTypes=['TABLES']
        )

    # --- Methods adapted from textract_table_parser.py ---
    # These are preserved to maintain the original logic structure and allow
    # Hybrid processors to generate CSVs for LLM consumption.

    def get_rows_columns_map(self, table_result: Dict[str, Any], blocks_map: Dict[str, Any]) -> Tuple[Dict[int, Dict[int, str]], List[str]]:
        rows = {}
        scores = []
        if 'Relationships' in table_result:
            for relationship in table_result['Relationships']:
                if relationship['Type'] == 'CHILD':
                    for child_id in relationship['Ids']:
                        cell = blocks_map[child_id]
                        if cell['BlockType'] == 'CELL':
                            row_index = cell['RowIndex']
                            col_index = cell['ColumnIndex']
                            if row_index not in rows:
                                # create new row
                                rows[row_index] = {}
                            
                            # get confidence score
                            if 'Confidence' in cell:
                                scores.append(str(cell['Confidence']))
                                
                            # get the text value
                            rows[row_index][col_index] = self.get_text(cell, blocks_map)
        return rows, scores

    def get_text(self, result: Dict[str, Any], blocks_map: Dict[str, Any]) -> str:
        text = ''
        if 'Relationships' in result:
            for relationship in result['Relationships']:
                if relationship['Type'] == 'CHILD':
                    for child_id in relationship['Ids']:
                        word = blocks_map[child_id]
                        if word['BlockType'] == 'WORD':
                            if "," in word['Text'] and word['Text'].replace(",", "").isnumeric():
                                text += '"' + word['Text'] + '"' + ' '
                            else:
                                text += word['Text'] + ' '
                        if word['BlockType'] == 'SELECTION_ELEMENT':
                            if word['SelectionStatus'] =='SELECTED':
                                text +=  'X '
        return text.strip()

    def generate_table_csv(self, table_result: Dict[str, Any], blocks_map: Dict[str, Any], table_index: int) -> str:
        rows, scores = self.get_rows_columns_map(table_result, blocks_map)

        table_id = 'Table_' + str(table_index)
        
        # get cells.
        csv = 'Table: {0}\n\n'.format(table_id)

        for row_index, cols in rows.items():
            # Sort columns by index to ensure order
            sorted_cols = sorted(cols.items())
            for col_index, text in sorted_cols:
                csv += '{}'.format(text) + ","
            csv += '\n'
            
        # Optional: Include confidence scores if needed, but for LLM processing usually just text is fine
        # csv += '\n\n Confidence Scores % (Table Cell) \n'
        # ... (omitted for brevity in this context, but logic exists in get_rows_columns_map)

        csv += '\n\n\n'
        return csv

    def get_all_tables_as_csv(self, textract_response: Dict[str, Any]) -> str:
        """
        Helper to convert full Textract response to a CSV string containing all tables.
        Useful for Hybrid processing.
        """
        blocks = textract_response.get('Blocks', [])
        blocks_map = {block['Id']: block for block in blocks}
        table_blocks = [block for block in blocks if block['BlockType'] == "TABLE"]

        if not table_blocks:
            return ""

        csv_output = ""
        for index, table in enumerate(table_blocks):
            csv_output += self.generate_table_csv(table, blocks_map, index + 1)
        
        return csv_output

    # --- Internal Parsing Logic for Pure AWS Mode ---

    def _parse_textract_json(self, raw_json: Dict[str, Any]) -> List[FlightEntry]:
        """
        Returns a list of flight records extracted from Textract JSON.
        Uses the get_rows_columns_map helper to standardize extraction.
        """
        blocks = raw_json.get('Blocks', [])
        blocks_map = {block['Id']: block for block in blocks}
        table_blocks = [block for block in blocks if block['BlockType'] == "TABLE"]

        if not table_blocks:
            return []

        all_records = []

        for table in table_blocks:
            # Use the shared helper
            rows, _ = self.get_rows_columns_map(table, blocks_map)
            if not rows:
                continue
            
            # Attempt to find the header row
            header_row_index = -1
            header_map = {}
            
            sorted_row_indices = sorted(rows.keys())
            for idx in sorted_row_indices:
                row_data = rows[idx]
                temp_map = self._map_headers(row_data)
                # Heuristic: if we matched at least 3 columns, assume this is the header
                if len(temp_map) >= 3:
                    header_row_index = idx
                    header_map = temp_map
                    break
            
            if header_row_index == -1:
                # Fallback: assume first row is header if we can't find a better one
                if sorted_row_indices:
                    header_row_index = sorted_row_indices[0]
                    header_map = self._map_headers(rows[header_row_index])

            # Iterate over data rows
            for row_index in sorted_row_indices:
                if row_index <= header_row_index:
                    continue
                
                row_data = rows[row_index]
                record = self._create_flight_record(row_data, header_map)
                if record:
                    all_records.append(record)
                    
        return all_records

    def _map_headers(self, header_row: Dict[int, str]) -> Dict[str, int]:
        mapping = {}
    
        patterns = {
            'date': re.compile(r'date', re.IGNORECASE),
            'tailNumber': re.compile(r'tail|ident|registration|reg', re.IGNORECASE),
            'srcIcao': re.compile(r'from|source|dep|route.*from|origin', re.IGNORECASE),
            'destIcao': re.compile(r'to|dest|arr|route.*to|destination', re.IGNORECASE),
            'totalFlightTime': re.compile(r'total|duration|time.*flight', re.IGNORECASE),
            'picTime': re.compile(r'pic|pilot\s*in\s*command', re.IGNORECASE),
            'instrumentTime': re.compile(r'inst|instrument', re.IGNORECASE),
            'dualReceivedTime': re.compile(r'dual|received', re.IGNORECASE),
            'dayLandings': re.compile(r'day\s*ldg|landings.*day|day', re.IGNORECASE),
            'nightLandings': re.compile(r'night\s*ldg|landings.*night', re.IGNORECASE),
            'remarks': re.compile(r'remark|comment|note', re.IGNORECASE),
        }

        for col_index, text in header_row.items():
            for field, pattern in patterns.items():
                if field not in mapping and pattern.search(text):
                    mapping[field] = col_index
                    break 
        
        return mapping

    def _parse_remarks_for_flags(self, remarks: str) -> tuple[bool, bool, bool]:
        """
        Extract boolean flags from remarks/notes section.
        Returns: (crossCountry, night, solo)
        """
        remarks_lower = remarks.lower()
        cross_country = bool(re.search(r'cross.?country|xc|cross|country', remarks_lower))
        night = bool(re.search(r'\bnight\b|nvg', remarks_lower))
        solo = bool(re.search(r'\bsolo\b', remarks_lower))
        return cross_country, night, solo

    def _create_flight_record(self, row_data: Dict[int, str], header_map: Dict[str, int]) -> Optional[FlightEntry]:
        try:
            def get_val(field):
                col_idx = header_map.get(field)
                if col_idx is not None:
                    return row_data.get(col_idx, "")
                return ""

            def parse_float(val):
                if not val: return 0.0
                # Remove non-numeric chars except dot
                clean = re.sub(r'[^\d.]', '', val)
                try:
                    return float(clean)
                except:
                    return 0.0

            def parse_int(val):
                if not val: return 0
                clean = re.sub(r'[^\d]', '', val)
                try:
                    return int(clean)
                except:
                    return 0

            date_str = get_val('date')
            # Basic validation: if no date, it's likely not a valid record
            if not date_str:
                return None

            remarks_str = get_val('remarks')
            cross_country, night, solo = self._parse_remarks_for_flags(remarks_str)

            return FlightEntry(
                date=date_str,
                tailNumber=get_val('tailNumber'),
                srcIcao=get_val('srcIcao'),
                destIcao=get_val('destIcao'),
                totalFlightTime=parse_float(get_val('totalFlightTime')),
                picTime=parse_float(get_val('picTime')),
                dualReceivedTime=parse_float(get_val('dualReceivedTime')),
                instrumentTime=parse_float(get_val('instrumentTime')),
                crossCountry=cross_country,
                night=night,
                solo=solo,
                dayLandings=parse_int(get_val('dayLandings')),
                nightLandings=parse_int(get_val('nightLandings')),
                remarks=remarks_str
            )
        except Exception as e:
            print(f"Error creating record: {e}")
            return None
