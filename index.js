const axios = require("axios")
const fs = require("fs")
const infls = (fs.readFileSync("./infls.txt",'utf-8')).split(/\r?\n/)
console.log(infls)
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function request(infl) {
    try{
      let res = await axios.get(`https://api.twitter.com/2/users/${infl.split("|")[0]}/following?max_results=30`, {headers:{'Authorization': `Bearer ${token}`}});
      return res.data.data;
    } catch(err) {
      console.log(err);
      await axios.post(webhook,{content:"Внутренняя ошибка, обратитесь к администратору"});
      return err
    }
}

(async function start() {
  console.log("Собираю БД");
  for (let a=0;a<infls.length;a++) {
    if (a%15==0 && a!=0) {await sleep(960000)}
    let infl = infls[a]
    let subs = await request(infl)

    fs.writeFileSync(`./cache/${infl.split("|")[0]}.txt`, JSON.stringify(subs))
    await sleep(100)
  }
  console.log("БД собрана")
  await sleep(960000)

  while (true) {
    for (let a=0;a<infls.length;a++) {
      if (a%15==0 && a!=0) {await sleep(960000)}
      let infl = infls[a]
      let subs = await request(infl)
      let cache = JSON.parse(fs.readFileSync(`./cache/${infl.split("|")[0]}.txt`, 'utf-8'))

      let newsubs = subs.filter(({ id: id1 }) => !cache.some(({ id: id2 }) => id2 === id1));
      if (newsubs.length > 0) {
        for (let us of newsubs) {
          if (!us.username) {us.username="(Нет ссылки)"} else{us.username=`(https://twitter.com/${us.username})`}
          try {await axios.post(webhook,{content:`Инфлюенсер ${infl.split("|")[1]} из ${infl.split("|")[2]} подписался на пользователя ${us.name} ${us.username}` })}catch(err) {console.log("Не могу отправить сообщение "); console.log(err)}
          await sleep(100)
        }
        fs.writeFileSync(`./cache/${infl.split("|")[0]}.txt`, JSON.stringify(subs))
      }
      await sleep(100)
    }
    let d = new Date()
    console.log(d.toString())
    await sleep(1000000)
  }

})()
  


