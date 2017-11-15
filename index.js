const express = require('express');
const app = express();
const cors = require('cors');
const GoogleImages = require('google-images');
const cseID = "017187005052502952009:xmpxh8jq8c0";
const apiKey = "AIzaSyBo07s-BxwmUm49GGTo-U0jW57Ty78UvBA";
const client = new GoogleImages(cseID, apiKey);
const mongoose = require('mongoose');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://kyawzintun:test@ds261755.mlab.com:61755/image-search');
const imgSearchSchema = mongoose.Schema({
  keywords: String,
  time: { type: String, index: true }
});
imgSearchSchema.index({ time: 1 });
imgSearchSchema.set('autoIndex', false);
const ImgEntry = mongoose.model('ImgEntry', imgSearchSchema);

app.get('/', (req, res)=> {
  res.render('pages/index');
});

app.get('/latest/search', (req, res) => {
  ImgEntry
    .find()
    .sort({ time: -1 })
    .select({ _id: 0, keywords: 1, time: 2 })   
    .then(docs => {
      if(!docs) {
        res.json({error: 'Unknown Error'});
      }
      res.json(docs)
    });
});

app.get('/searchimage/*', (req, res)=> {
  console.log('req query ',req.query)
  let keywords = req.params[0];
  client.search(keywords)
  .then(images => {
    let arr = [];
    if(images) {
      images.forEach(img => {
        let obj = {
          "url": img.url,
          "snippet": img.description,
          "thumbnail": img.thumbnail.url,
          "context": img.parentPage
        }
        arr.push(obj);
      });
      insertNew(keywords).then(inserted => {
        if (!inserted) {
          console.log('database insert query fail');
        } else {
          console.log('insert successful ', inserted);
        }
      });
      res.json(arr);
    }else {
      res.json({error: 'Unkown Error'});
    }
  });
});

function insertNew(keyword) {
  let date = new Date().toISOString();
  let obj = new ImgEntry({ keywords: keyword, time: date });
  return obj.save();
}

app.listen(port, () => {
  console.log('Node app is running on port', port);
})