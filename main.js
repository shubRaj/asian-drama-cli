#!/usr/bin/env node
import WatchAsian from "./utils/watchasian.js";
import gradient from "gradient-string";
import inquirer from "inquirer";
import figlet from "figlet";
import { execFile } from "node:child_process";
import { createSpinner } from 'nanospinner';
async function launchVLC(source) {
    let spinner = createSpinner('Playing on VLC Player').start();
    execFile("vlc", [source,], (err, stdout, stderr) => {
        if (err) throw new Error(err.message);
        else if (stderr) {
            spinner.error({text:"VLC Player CLOSED"});
        }

    })
}
async function promptOptions(dramas) {
    const answers = await inquirer.prompt({
        name: "drama",
        type: "list",
        message: "Select From the List Below: ",
        choices: dramas,
    })
    return answers.drama
}
async function promptSearch() {
    const answer = await inquirer.prompt({
        name: "title",
        type: "input",
        message: "Search Drama By Title: ",
    });
    return answer.title;
}
const sleep = (ms = 2000) => new Promise((resolve, reject) => setTimeout(resolve, ms));
(async function main() {
    console.clear();
    const WA = new WatchAsian();
    const WELCOME = `ASIAN DRAMA CLI`
    figlet(WELCOME,(err,data)=>{
        console.log(gradient.instagram.multiline(data));
    })
    console.log(gradient.atlas("GITHUB: https://github.com/shubraj/asian-drama-cli"))
    await sleep(4000);
    console.clear();
    const keyword = await promptSearch();
    let spinner = createSpinner(`Searching For Drama Titled ${keyword}`).start();
    const searchResult = await WA.search(keyword);
    if (searchResult.length) {
        spinner.success({ text: `${searchResult.length} Results Found` });
    } else {
        spinner.error({ text: `Couldn't find any drama Titled ${choosedDrama.name}` });
        process.exit(1);
    };
    const dramas = searchResult.map((drama, index) => `${index + 1}. ${drama.name}`);
    const choosedDrama = searchResult[parseInt(await promptOptions(dramas)) - 1];
    spinner = createSpinner('Searching Episodes').start();
    const episodesResult = await WA.episodes(`https://watchasian.sh${choosedDrama.url}`);
    if (episodesResult.length) {
        spinner.success({ text: `${choosedDrama.name}'s Episodes Found` });
    } else {
        spinner.error({ text: `Couldn't find any episode of drama ${choosedDrama.name}` });
        process.exit(1);
    };
    const episodes = episodesResult.map((episode, index) => `${index + 1}. Episode ${episode.episodeNumber} [${episode.type}]`);
    const choosedEpisode = episodesResult[parseInt(await promptOptions(episodes)) - 1];
    spinner = createSpinner('Searching for video source').start();
    const { source: sourcesResult } = await WA.sources(`${choosedEpisode.source}`);
    if (sourcesResult.length) {
        spinner.success({ text: `${sourcesResult.length} Sources Found` });
    } else {
        spinner.error({ text: `Source Not Found` });
        process.exit(1);
    };
    const sources = sourcesResult.map((source, index) => `${index + 1}. ${source.label.split(" ")[0]} Quality`);
    const { file } = sourcesResult[parseInt(await promptOptions(sources)) - 1];
    await launchVLC(file);
})()