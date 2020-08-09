//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:WTG30303@cluster0-o1on2.mongodb.net/todolistDB", {useNewUrlParser: true});

//schema plural
const itemsSchema = {
  name: String
};
//mongoose model based on itemsSchema
//capitalized, and singular version in param, second param schema
const Item = mongoose.model("item", itemsSchema );

//create document
const item1 = new Item({
  name: "Todo list"
});
const item2 = new Item({
  name: "say hi"
});
const item3 = new Item({
  name: "do it now"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    //if no items in found items
    //insert array of defaultItems into DB
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Insert default items completed to DB");
        }
      });
      res.redirect("/"); //redirect back here, but this time will run else block instead
    } else {
      //else, im just going to render/show the list
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
    //redirect back to homeroute method, which will render all the list.find
    //including this new one that is just saved to the database on mongo
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      //push new items into array
      res.redirect("/" + listName);
    });
  }


});

app.post("/delete", function(req, res) {
  const itemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemID, function(err){
      if (!err) {
        console.log("Deleted checked item");
      }
    });
    res.redirect("/");
  } else {
    //if from custom list
    //pull from items array an item that has ID : itemID
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  //call back function, err and what was found(which is what list is found?)
  //findone returns an object
  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if(!foundList) {
        //if no error
        //if not list found
        //create list
        const list = new List({
          name: customListName,
          items: [defaultItems]
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }

    }


  })

});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port success");
});
