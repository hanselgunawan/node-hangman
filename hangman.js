/**
 * Created by hansel.tritama on 10/26/17.
 */
const inquirer = require("inquirer");
const Spotify = require("spotify-web-api-node");
const keys = require("./keys.js");
const spotify = new Spotify(keys.spotifyKeys);
const word = require("./word.js");
const letter = require("./letter.js");
const clear = require('clear');
const _ = require('underscore');

function hangmanGame()
{
    let that = this;
    this.questionArr = [];
    this.lettersInWord = [];
    this.wrongGuessedLetter = [];
    this.randomizeNum = -1;
    this.remaining = 10;
    this.error_message = "";
    this.init = function () {
        this.remaining = 10;
        this.wrongGuessedLetter = [];
    };
    this.getWords = function () {
        return new Promise((resolve, reject) => {
            spotify.clientCredentialsGrant()
                .then(function(data) {
                    //console.log('The access token expires in ' + data.body['expires_in']);
                    //console.log('The access token is ' + data.body['access_token']);
                    // Save the access token for future calls
                    spotify.setAccessToken(data.body['access_token']);

                    spotify.searchTracks("christmas jazz")
                        .then(function(data) {
                            let limit = data.body.tracks.limit;
                            for(let i=0;i<limit;i++)
                            {
                                let song = new word();
                                song.title = data.body.tracks.items[i].name.replace("'", "");
                                song.titleLength = song.title.length;
                                that.questionArr.push(song);
                            }
                            that.storeLetter(that.questionArr);
                            resolve();
                        }, function(err) {
                            console.log(err);
                        });
                }, function(err) {
                    console.log('Something went wrong when retrieving an access token', err);
                });
        })
    };
    this.storeLetter = function (question_array) {
        for(let i = 0; i<question_array.length;i++)
        {
            let song_letter = new letter();
            for(let j=0;j<question_array[i].title.length;j++)
            {
                song_letter.letters_in_word.push(question_array[i].title[j]);
                if(question_array[i].title[j] !== " ") song_letter.underscore_letter.push("_");
                else song_letter.underscore_letter.push(" ");
            }
            this.lettersInWord.push(song_letter);
        }
    };
    this.displayQuestion = function (underscore_letter_array) {
        clear();
        let str_question = "";
        let wrongLetters = "";
        for(let i=0; i<underscore_letter_array.underscore_letter.length; i++)
        {
            str_question += underscore_letter_array.underscore_letter[i];
        }

        for(let j=0; j<this.wrongGuessedLetter.length;j++)
        {
            wrongLetters += this.wrongGuessedLetter[j].toUpperCase();
        }

        console.log("Question: ");
        console.log(str_question);
        console.log("Remaining guess: " + this.remaining);
        console.log("Wrong guessed letter: ");
        console.log(wrongLetters.split("").join(","));
        console.log(this.error_message);
        this.displayPromptInput(underscore_letter_array);
    };
    this.playAgain = function () {
        inquirer
            .prompt([
                {
                    type: "list",
                    message: "Play again?",
                    name: "play_again",
                    choices: ["Yes", "No"]
                }
            ])
            .then(function(answer) {
                if(answer.play_again === "Yes")
                {
                    that.init();
                    that.startGame();
                }
                else
                {
                    console.log("Thank you for playing!");
                }
            });
    };
    this.winGame = function (letter_array) {
        clear();
        let str_question = "";
        for(let i=0; i<letter_array.underscore_letter.length; i++)
        {
            str_question += letter_array.underscore_letter[i];
        }
        console.log(str_question);
        console.log("You Win!");
        this.playAgain();
    };
    this.loseGame = function () {
        clear();
        console.log("You Lose!");
        this.playAgain();
    };
    this.checkLetter = function (letter_array, userLetter) {
        let array = [];
        if(letter_array.underscore_letter.indexOf(userLetter) !== -1) this.error_message = "You already guessed that letter. Try other letters!";
        else this.error_message = "";
        letter_array.letters_in_word.forEach(v => {array.push(v.toLowerCase())});
        if(array.indexOf(userLetter) !== -1)
        {
            for(let i=0; i<array.length; i++)
            {
                if(array[i] === userLetter.toLowerCase())
                {
                    letter_array.underscore_letter[i] = letter_array.letters_in_word[i];
                }
            }
        }
        else
        {
            if(!_.contains(this.wrongGuessedLetter, userLetter))
            {
                this.error_message = "Letter not found!";
                this.wrongGuessedLetter.push(userLetter);
                this.remaining--;
            }
            else
            {
                this.error_message = "You already guessed that letter. Try other letters!";
            }
            if(this.remaining === 0) this.loseGame();
        }
    };
    this.checkUnderscore = function (letter_array) {
          if(letter_array.underscore_letter.indexOf("_") === -1) return true;
          else return false;
    };
    this.displayPromptInput = function (letter_array) {
        inquirer
            .prompt([
                {
                    message: "Guess a letter",
                    name: "letter",
                    validate: function (value) {
                        if(value.length>1 || !value.match("^[a-zA-Z\(\)]+$"))
                        {
                            that.error_message = "Invalid letter. Try other letters!";
                            that.displayQuestion(letter_array);
                            return false;
                        }
                        else
                        {
                            return true;
                        }
                    }
                }
            ])
            .then(function(answer) {
                //that.randomizeNum = Math.floor(Math.random()*that.questionArr.length) + 1;
                that.checkLetter(letter_array, answer.letter);
                let allUnderscore = that.checkUnderscore(letter_array);
                if(allUnderscore === true) that.winGame(letter_array);
                else that.displayQuestion(letter_array);
            });
    };
    this.startGame = function () {
        this.randomizeNum = Math.floor(Math.random()*this.questionArr.length) + 1;
        this.displayQuestion(this.lettersInWord[this.randomizeNum]);
    }
}

let newGame = new hangmanGame();
clear();
let dot = 0;
let load = setInterval(function () {
    clear();
    let wait_dot = ". ";
    console.log("Loading " + wait_dot.repeat(dot));
    dot++;
}, 50);
newGame.getWords().then(v => {
    clearInterval(load);
    clear();
    console.log("WELCOME TO HANG-MANIA (CHRISTMAS EDITION)!");
    inquirer
        .prompt([
            {
                type: "list",
                message: "Start Game?",
                name: "start_option",
                choices: ["Start Game", "Exit"]
            }
        ])
        .then(function(answer) {
            if(answer.start_option === "Start Game")
            {
                console.log(newGame.questionArr);
                newGame.startGame();
            }
            else
            {
                console.log("Thank you for playing!");
            }
        });
});





























//clear() <-- to clear command prompt screen

//--------//
//BACK UP//
//------//

// let randomNum = Math.floor(Math.random()*(20-counter)) + 1;
// counter++;
// let haha;
// haha = data.body.tracks.items[randomNum].name;
// if(haha !== null)resolve(haha);
// else reject("Not found!");
// data.body.tracks.items.splice(randomNum, 1);

// let questionArr = [];
// let lettersInWord = [];
// let randomizeNum = -1;
// let remaining = 8;

// function storeLetter(question_array) {
//
// }

// function getWords()
// {
//     return new Promise((resolve, reject) => {
//         spotify.clientCredentialsGrant()
//             .then(function(data) {
//                 //console.log('The access token expires in ' + data.body['expires_in']);
//                 //console.log('The access token is ' + data.body['access_token']);
//                 // Save the access token for future calls
//                 spotify.setAccessToken(data.body['access_token']);
//
//                 spotify.searchTracks("christmas jazz")
//                     .then(function(data) {
//                         let limit = data.body.tracks.limit;
//                         for(let i=0;i<limit;i++)
//                         {
//                             let song = new word.Word();
//                             song.title = data.body.tracks.items[i].name.replace("'", "");
//                             song.titleLength = song.title.length;
//                             questionArr.push(song);
//                         }
//                         storeLetter(questionArr);
//                         // let randomNum = Math.floor(Math.random()*(20-counter)) + 1;
//                         // counter++;
//                         // let haha;
//                         // haha = data.body.tracks.items[randomNum].name;
//                         // if(haha !== null)resolve(haha);
//                         // else reject("Not found!");
//                         // data.body.tracks.items.splice(randomNum, 1);
//                     }, function(err) {
//                         console.log(err);
//                     });
//             }, function(err) {
//                 console.log('Something went wrong when retrieving an access token', err);
//             });
//     })
// }

// function displayQuestion(underscore_letter_array) {
// }



// function startGame() {
//       randomizeNum = Math.floor(Math.random()*questionArr.length) + 1;
//       displayQuestion(lettersInWord[randomizeNum]);
//       displayPromptInput();
// }

// function Word(){
//     //let that = this;//You need to save a reference to the context where the setTimeout function call is made, because setTimeout executes the function with this pointing to the global object
//     spotifyRandomize().then(v =>{
//         this.question_word = v;
//         console.log(this.question_word);
//         }, e => {console.log(e)});
// }

// let question = new Word();
// console.log(question);
// setTimeout(function() {
//     console.log(question);
// }, 1500);

// getQuestion().then(v => {
//     setTimeout(function () {
//         console.log(questionArr);
//     }, 3000);
// }, e => {console.log(e)});