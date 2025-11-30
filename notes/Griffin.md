# What I did if you're unsure

## Merge branch 'main' into GriffinNessa-OCR

Integrate nextjs switch. I cannot get it to run properly on my windows machine. I get this strange error:
    Skipping creating a lockfile at C:\Users\griff\Documents\GitHub\PaperPlane\.next\dev\lock because we're using WASM bindings
    Error: `turbo.createProject` is not supported by the wasm bindings.
        at ignore-listed frames
which I've been trying to fixn


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
