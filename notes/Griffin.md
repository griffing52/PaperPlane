# What I did if you're unsure

## AWS processor works + tests for all added!

Polished pipeline and created good mock data for the test api functionality! Also manual tested it, looks good! Maybe remove textract raw output from https return in future?

Command notes for me to explain later:
pip install -e .
uvicorn main:app --reload

## Temporary test suite for OCR zoo

Added intial mockup for test suite, didn't confirm mock data and functionality yet but outlined testing foundation and pipeline

## OCR Hybrid processing and AWS integration

Enhance OCR functionality with Hybrid processing and Gemini integration and updated environment variables and modularized code structured. Need to create test suite now to make sure it's good!

Prompted Gemini 3 Pro with the following to take current tested code and insert and refactor it into AWS image processing wrapper with the following prompt:

You are a professional systems and software engineer. Using and reformatting the textract processing code provided, can you implement the pure AWS processor that takes the table output, which should have the following header (or similar):
Date	Aircraft Type	Tail Number	Source Airport	Destination Airport	Total Time (hrs)	PIC Hours (hrs)	Instrument Hours (hrs)	Night Hours (hrs)	Landings (Day)	Landings (Night)	Remarks

It should return an error if it doens't understand the data (error handling by the frontend for display to user), but it shouldn't crash the program. Please fill in the aws_processor, while maintaining processor design practices.

## Add gemini image understanding (untested but independent!)

Used gemini [docs](https://ai.google.dev/gemini-api/docs/image-understanding) to fill gemini OCR image processor functionality.

## Modularize OCR with temporary mockup

I was thinking about the implementation hiding principle and figured it wouldn't be a bad thing to both modularize the image processor as well as
allow for other implementations in the future (or even as I continue developing this in case we run into issues with Textract).

## Initialize script helpers for TA

Getting ready for when our TA is going to have to try to run this! Hopefully these shell scripts (and ps1 script potentially if on windows
if I end up adding that part too) will make it easier to get everything up and running, installing all dependencies and other configuration steps!

## Merge branch 'main' into GriffinNessa-OCR

Integrate nextjs switch. I cannot get it to run properly on my windows machine. I get this strange error:
    Skipping creating a lockfile at C:\Users\griff\Documents\GitHub\PaperPlane\.next\dev\lock because we're using WASM bindings
    Error: `turbo.createProject` is not supported by the wasm bindings.
        at ignore-listed frames
which I've been trying to fixn

## Give NumberField settable min value and setup

I added component options for clamping numbers that don't make sense like negative hours flown and decimal day and night landings.

## Configured and tested AWS Textract

Followed the prerequisite instructions listed here: https://docs.aws.amazon.com/textract/latest/dg/examples-blocks.html#examples-prerequisites
and used the example skeleton code from this: https://docs.aws.amazon.com/textract/latest/dg/how-it-works-tables.html

After that, you can run (after activating the .venv):
    python textract_python_table_parser.py file

For .venv, create python .venv. Install requirements in requirements.txt

## Test AWS Textract and paddleocr

Testing new OCRs specialized in table recognition after Tesseract wasn't performing well

## Collect OCR test images and start Tesseract testing

Collected template files from tesseract docs for testing. Gathered images off web as examples.

## Project init

This is how I created the project 

```bash
npm create vite@latest . -- --template react-ts
```
Usually you can just say 

```bash
npm create vite@latest
```

but I was just trying a couple of other things.

And I set the package name to paperplane, choosing React as the framework, with TypeScript, no rolldown-vite because I didn't know what that was and it said it was experimental, and finally I said yes to install with npm and start now.

As a note, I used Vite because it is a pretty fast and simple (and more modern) build system for React that doesn't really change the process that much--and I saw Tobias using it in one of his examples so I assume it was okay.

## Initial commit

Came from github repo creation
