# Sample interactive project

Quickly spin up a project template that provides boot.js and iframe loading.
The idea is to reduce the time required to go from idea discussion to 
stuff on screen, and to simplify deployment to S3.

## Getting started
If you haven't already installed [nodejs](http://nodejs.org/download/)
and [grunt-cli](http://gruntjs.com/getting-started), go do that first.

Fork the project over on github then clone your new fork.

```bash
> git clone git@github.com:guardian/my-new-project.git
> cd my-new-project
> npm install
> grunt
```

You can now view the example project running at http://localhost:9000/

## Loading data
There are two ways to load data into your application, locally that will
require a new deploy each time the data is updated and remotely from
an external JSON file.

### Local data
If you want to load locally stored data you can use the `grunt fetch` task
that will download an remote file and store it in the `src/js/app/data` folder.

To specify what file is downloaded and where it is store you'll need to 
modify the `curl` task in the Gruntfile.js, eg.

```javscript
    curl : { 'local/path/mydata.json': 'http://example.com/data.json' }
```

To load the data in your application require it `text!local/path/mydata.json`
in the `define([]` header. See the sample `js/app/main.js` to see an example
of this working.

The local JSON data will be combined along with all the other `.js` files into
one big file.

Remember, if the data is updated you'll need to deploy the whole application
again.

### Remote data aka. Google sheets
If the data is likely to change over time then you'll probably want to fetch
it separately. The template project has support for fetching Google sheets
that have been proxied on S3 and there's an example of this working in the
`js/app/main.js` file. 

To fetch a remote S3 proxied JSON file, first include the `sheetCollection` in
the `define(['collections/sheetCollection']`, then create a new instance
providing the Google sheet key and sheet name. Calling `.fetch()` on the 
collection instance will start an async `$.getJSON()` fetch behind the scenes
and store the retrieved data.

**So when do I get my data?**
Because the `.fetch()` request is asynchronous, you will need to wait the
request to return. There are two ways to listen for the successful fetching
of data, either listen for the `reset` event on the collection or provide
a success callback function to the fetch method, here's an example of both:

```JavaScript
var myCollection = new SheetCollection({
    key: 'xxx-google-sheet-key-xxx',
    sheetname: 'data-sheet'
});

// Passing along a succss callback
myCollection.fetch({
    success: function(data) {
        console.log(data);
    }
});

// Listening to the fetch success
myCollection.on('reset', function(data) {
    console.log(data); 
});
myCollection.fetch();
```

The nice thing about listening to the 'reset' event is that multiple views
can share the once collection and all listen to the 'reset' event.

## Deploying to S3

Once you ready to to play to S3 you can use grunt to upload your files.

First you'll need to specify where the files are to be uploaded to. This
is done in the `package.json` file (note: this is probably not the best
place to store that information, it might change in the future).

In the `package.json` there is a section for `config` which contains
the paths that the deploy task will upload to. Change these paths to
whatever you need them to be.

```json
  "config": {
    "port": 9000,
    "s3_folder": "embed/testing/path/",
    "cdn_url": "http://interactive.guim.co.uk/embed/testing/path/"
  },
```

Next you'll want to simulate the upload to ensure it's going to do what
you think it will.
```bash
> grunt deploy --test
```

Once you're happy everything looks good, deploy for real.
```bash
> grunt deploy
```


