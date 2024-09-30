const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
app.use(cors());
const port = 3000;

app.use(express.json());

app.post('/sen', (req, res) => {
   let sentenceText = '';
   for (let i = 0; i < req.body.length; i++) { // Use req.body to access the request body
      sentenceText += req.body[i] + '\n'; // Directly use \n for a new line
   }
   // fs.writeFile
   fs.appendFile('sen.txt', sentenceText, 'utf8', function (error) {
      if (error) {
         console.error('Error writing to sen.txt:', error);
         res.status(500).send('Error writing to sen.txt');
      } else {
         res.send('Sentences data written to sen.txt successfully');
      }
   });
});

app.post('/sol', (req, res) => {
   let solutionText = '';
   for (let i = 0; i < req.body.length; i++) {
      solutionText += req.body[i] + '\n';
   }
   fs.appendFile('sol.txt', solutionText, 'utf8', function (error) {
      if (error) {
         console.error('Error writing to sol.txt:', error);
         res.status(500).send('Error writing to sol.txt');
      } else {
         res.send('Solution data written to sol.txt successfully');
      }
   });
});


// del lines
// function deleteLines(filePath, linesToDelete) {
//    const fileContents = fs.readFileSync(filePath, 'utf8');
//    const lines = fileContents.split('\n');
//    for (let i = linesToDelete.length - 1; i >= 0; i--) {
//      lines.splice(linesToDelete[i], 1);
//    }
//    const newContents = lines.join('\n');
//    fs.writeFileSync(filePath, newContents, 'utf8');
//  }
//  xxx.addEventListener('click', () => { deleteLines('sen.txt', [0, 1, 2]); })

 app.listen(port, () => console.log(`Server listening at ${port}`));

//  if you want to achieve the same functionality as your server.js (writing to files), you would need to use a different approach, such as:
//  Using the fetch API to send requests to your server, which would then handle the file writing.
//  Utilizing IndexedDB or other client-side storage mechanisms to store data locally in the browser.
