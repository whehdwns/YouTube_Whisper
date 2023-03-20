const express = require('express');
const bodyParser = require('body-parser');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

const app = express();

// Parse request body as JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>YouTube to MP3 Converter</title>
        <style>
        /* Add some basic styling */
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
        }
  
        h1 {
          text-align: center;
          margin-top: 50px;
        }
  
        form {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 50px;
        }
  
        input[type="text"] {
          padding: 10px;
          border-radius: 5px;
          border: 1px solid #ccc;
          width: 400px;
          font-size: 16px;
        }
  
        button[type="submit"] {
          margin-top: 10px;
          padding: 10px;
          border-radius: 5px;
          border: none;
          background-color: #4CAF50;
          color: white;
          font-size: 16px;
          cursor: pointer;
        }
  
        .option {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
  
        .option label {
          margin-right: 10px;
        }
      </style>
      </head>
      <body>
        <h1>Convert YouTube to MP3</h1>
        <form id="convert-form" action="/convert" method="POST">
          <input type="text" name="url" placeholder="Enter YouTube link">
          <button type="submit">Convert</button>
        </form>
        <div id="transcript"></div>
        <div id="processing-text" style="display:none;">Processing...</div>
        <script>
          const form = document.getElementById('convert-form');
          form.addEventListener('submit', (event) => {
            event.preventDefault();
            const url = document.getElementsByName('url')[0].value;
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/convert');
            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          
            // Show the "Processing" text
            const processingTextElement = document.getElementById('processing-text');
            processingTextElement.style.display = 'block';
          
            xhr.onreadystatechange = function() {
              if (xhr.readyState === 4 && xhr.status === 200) {
                const transcript = xhr.responseText;
                const transcriptElement = document.getElementById('transcript');
                transcriptElement.innerHTML = '<h2>Transcript</h2><p>' + transcript + '</p>';
          
                // Hide the "Processing" text
                processingTextElement.style.display = 'none';
              }
            }
            xhr.send(JSON.stringify({ url: url }));
          });
        </script>
      </body>
    </html>
  `);
});

app.post('/convert', (req, res) => {
  const url = req.body.url;
  const video = ytdl(url, { quality: 'highestaudio' });
  const id = uuidv4(); // Generate a unique identifier for this conversion

  ffmpeg(video)
    .audioBitrate(128)
    .save(`${id}.mp3`) // Use the unique identifier as the filename
    .on('error', (err) => {
      console.log('An error occurred: ' + err.message);
      res.send('Error occurred while converting the video');
    })
    .on('end', () => {
      console.log('Conversion completed');
      const pythonProcess = spawn('python', ['transcribe.py', `${id}.mp3`]);
      let transcript = '';
      pythonProcess.stdout.on('data', (data) => {
        transcript += data.toString();
      });
      pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        res.setHeader('Content-Disposition', `attachment; filename="${id}.txt"`);
        res.send(transcript);
      });
    });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
