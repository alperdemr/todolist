const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/todo');

const itemSchema = new mongoose.Schema({name:String});
const Item = mongoose.model("Item",itemSchema);

const item1 = new Item({name:"Welcome to your todolist!"});
const item2 = new Item({name:"Hit the + button to add a new item."});
const item3 = new Item({name:"<-- Hit this to delete an item."});

const defaultItems = [item1,item2,item3];

const listSchema = {name:String,items:[itemSchema]};

const List = mongoose.model("List",listSchema);

app.get("/",function(req,res){
    Item.find({}).then(function(foundItems){
        if(foundItems.length === 0) {
            Item.insertMany(defaultItems).then(function(err){
                if(err) {
                    console.log(err);
                } else {
                    console.log("Succesfully saved default items to DB.");
                }


            });
            res.redirect("/");
        } else {
            res.render("list",{listTitle:"Today",newListItems:foundItems});
        }

    });
});

app.post("/",function(req,res){
    
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({name:itemName});

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name:listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        }).catch(function(err){
            console.log(err)
        });
    }
});

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName == "Today") {
        Item.findByIdAndRemove(checkedItemId).then(function(){
            console.log("Successfully deleted checked item.");
            res.redirect("/");
        }).catch(function(err) {
            console.error(err);
            res.status(500).send("Error deleting item.");
        });
    } else {
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}})
        .then(function() {
            res.redirect("/"+listName);
        }).catch(function(err) {
            console.error(err);
            res.status(500).send("Error deleting item.");
        });
    }
})

app.listen(3000,function(req,res){
    console.log("Server started on port 3000.");
})