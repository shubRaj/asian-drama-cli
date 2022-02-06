import fetch from "node-fetch";
import cheerio from "cheerio";
import puppeteer from 'puppeteer';
export default class WatchAsian {
    async request(url) {
        return await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:96.0) Gecko/20100101 Firefox/96.0",
                "X-Requested-With": "XMLHttpRequest",
            }
        })
    }
    async sources(url) {
        return new Promise(async (resolve, reject) => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on('request', async (request) => {
                const requestedURL = request.url();
                const hostname = (new URL(requestedURL)).hostname;
                if (hostname.includes("asian") || hostname.includes("drama")) {
                    if (["image", "media", "other", "stylesheet", "font"].includes(request.resourceType()))
                        request.abort();
                    else {
                        if (requestedURL.includes("encrypt-ajax")) {
                            const response = await this.request(requestedURL);
                            resolve(await response.json());
                            request.abort();
                        } else request.continue();
                    }
                } else request.abort();
            });
            await page.goto(url);
            await browser.close();
        })
    }
    async episodes(url) {
        const parsedURL = new URL(url);
        const resp = await this.request(url);
        const content = await resp.text();
        let $ = cheerio.load(content);
        let episodes = [];
        for (const episode of $(".all-episode").children()) {
            $ = cheerio.load(episode);
            const anchor = $("a");
            const source = `${parsedURL.origin}${anchor.attr("href")}`;
            $ = cheerio.load(anchor.html());
            const type = $(".type").text();
            const titleSplitted = $(".title").text().toLowerCase().split("episode");
            const episodeNumber = titleSplitted[titleSplitted.length - 1].trim();
            episodes.push({ source, type, episodeNumber });
        }
        return episodes;
    }
    async detail(url) {
        const resp = await this.request(url);
        if (resp.status === 200) {
            const content = await resp.text()
            const $ = cheerio.load(content);
            const downloadURL = `https:${$(".download").children().first().attr("href")}`
            const dramaID = (new URL(downloadURL)).searchParams
            return dramaID.get("id")
        }
    }
    async search(keyword) {
        const resp = await this.request(`https://watchasian.sh/search?keyword=${keyword}`);
        if (resp.status === 200) {
            const dramas = await resp.json();
            return dramas
        }
    }
}