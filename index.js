'use strict';

require('dotenv').config()
const axios = require('axios');
const fs = require('fs');

let comments = []

const makeRequest = async (url) => {
    try {
        let response = await axios.get(url)
        let body = response.data
        let nextPageToken = body.nextPageToken
        for (var item of body.items) {
            comments.push({
                "author": item.snippet.topLevelComment.snippet.authorDisplayName,
                "comment": item.snippet.topLevelComment.snippet.textOriginal
            })
        }
        return nextPageToken
    } catch (error) {
        throw new Error(error)
    };
}

const saveAllCommentsAsJson = async (videoId, nextPageToken) => {
    let url = 'https://www.googleapis.com/youtube/v3/commentThreads?key=' + process.env.API_KEY + '&textFormat=plainText&part=snippet&videoId=' + videoId
    if (nextPageToken !== undefined) {
        url += "&pageToken=" + nextPageToken
    }
    nextPageToken = await makeRequest(url)
    if (nextPageToken !== undefined) {
        saveAllCommentsAsJson(videoId, nextPageToken)
    } else {
        let data = JSON.stringify(comments)
        fs.writeFileSync('comments.json', data)
    }
}

const makeStats = (jsonPath) => {
    let categoriesRaw = fs.readFileSync("categories.json")
    let categories = JSON.parse(categoriesRaw)

    let commentsRaw = fs.readFileSync(jsonPath)
    let comments = JSON.parse(commentsRaw)

    for (let comment of comments) {
        for (let category of categories) {
            const regex = new RegExp(category.regex, 'i')
            if (comment.comment.match(regex)) {
                category.count++
                break
            }
        }
    }
    return categories
}

const generateJsForChart = (json) => {
    let res = []

    for (const result of json) {
        res.push({
            label: result.name,
            value: result.count
        })
    }
    let data = "let data = " + JSON.stringify(res)
    fs.writeFileSync('results.js', data)
}

//saveAllCommentsAsJson("VJFNcHgQ4HM").then()
generateJsForChart(makeStats("comments.json"))