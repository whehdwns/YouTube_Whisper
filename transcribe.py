import whisper
import sys

import warnings
warnings.filterwarnings("ignore")


model = whisper.load_model("base")

def trans(mp3):
    result = model.transcribe(mp3)
    full_transcript = []
    for i in range(len(result['segments'])):
        full_transcript.append(result['segments'][i]['text'])
    full_transcript_text = ''.join(full_transcript)
    return full_transcript_text

if __name__ == '__main__':
    mp3_file_path = sys.argv[1]
    transcript = trans(mp3_file_path)
    print(transcript)