const { execulInsert, execulUpdate, execulSelect, execulGetId } = require("./util/mysqlUtil");
const axios = require("axios");
const jquery = require("jquery")
const { JSDOM } = require("jsdom")

async function getList(index) {
  let page = index || 1;
  try {
    while (true) {
      let res = await fetchApi(page)
      if (res.list.length == 0) {
        console.log("数据爬取完成");
        return;
      }
      await parseList(res.list)
      page++;
      await sleep(1000)
    }
  } catch (error) {
    // 反爬重连
    console.log(`当前已经反爬,页数为:${page},5s后自动重新获取${page}页数据`);
    await sleep(5000)
    await getList(page);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

async function parseList(list) {
  for (const item of list) {
    const { qishu, date, result } = item;
    const redNums = result.slice(0, result.length - 1).join()
    const blueNum = result[result.length - 1];
    const insertParams = [qishu, redNums, blueNum, date];
    const updateParams = [redNums, blueNum, date, qishu];
    const bool = await execulSelect(qishu)
    if (!bool) {
      await execulInsert(insertParams)
    } else {
      await execulUpdate(updateParams)
    }
    console.log(`第${qishu}期解析完成`);
  }
}

// 调用接口
async function fetchApi(page) {
  const params = {
    page,
  }
  const url = "http://m.78500.cn/kaijiang/ssq/";
  const headers = {
    "X-Requested-With": "XMLHttpRequest"
  }
  const res = await axios(url, {
    headers,
    params
  })
  return res.data;
}

// 解析html
async function getHtml() {
  const url = "http://m.78500.cn/kaijiang/ssq/";
  const res = await axios(url)
  const { window } = new JSDOM(res.data);
  const $ = jquery(window)
  const list = [];
  const qishus = [];
  $(".item").each((index, item) => {
    const el = $(item);
    const qishu = el.find("strong").text().replace(/\D.*/, "");
    const date = el.find("span").text().match(/\d{4}.\d{2}.\d{2}/g)[0];
    const nums = [];
    // 红色球
    el.find("i").each((index, item) => {
      nums.push($(item).text())
    });
    // 蓝色球
    nums.push(el.find("b").text())
    qishus.push(qishu)
    list.push({
      result: nums,
      qishu,
      date
    })
  })
  return {
    list,
    maxId: Math.max.apply(null, qishus)
  }
}


async function main() {
  // 获取第一页数据 html
  const { list, maxId } = await getHtml();
  const MAX_ID = await execulGetId("max");
  // const MIN_ID = await execulGetId("min");
  if (maxId == MAX_ID) {
    console.log(`已经是最新期数(${MAX_ID}),无需继续更新`);
    return;
  } else {
    await parseList(list)
  }
  await getList()
}


main();
