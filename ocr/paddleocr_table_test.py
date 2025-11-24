# currently unused test file for paddleocr table recognition model

from paddleocr import TableStructureRecognition
model = TableStructureRecognition(model_name="SLANet_plus")
output = model.predict(input="./ocr/test_images/example2.png", batch_size=1)
# output = model.predict(input="table_recognition.jpg", batch_size=1)
for res in output:
    res.print(json_format=False)
    res.save_to_json("./output/res.json")