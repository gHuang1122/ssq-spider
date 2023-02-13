const mysql = require("mysql")

function getConnection() {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "root",
      database: "ssq"
    })
    resolve(connection)
  })
}

function execul(sql, params) {
  return new Promise(async (resolve, reject) => {
    const connection = await getConnection()
    connection.query(sql, params, (err, results) => {
      if (err) reject(err)
      connection.end()
      resolve(results)
    })
  })
}

// 新增数据
const INSER_SQL = "INSERT INTO history_result(id,red_nums,blue_num,date_time) VALUES(?,?,?,?)";
const execulInsert = async (params) => {
  const res = await execul(INSER_SQL, params)
  return res;
}

// 查询id数据
const SELECT_SQL = "SELECT * from history_result WHERE(id = ?)"
const execulSelect = async (id) => {
  try {
    const res = await execul(SELECT_SQL, id)
    return res.length != 0;
  } catch (error) {
    return false
  }
}

// 更新数据
const UPDATE_SQL = "UPDATE history_result set red_nums=?,blue_num=?,date_time=? WHERE(id = ?)";
const execulUpdate = async (params) => {
  const res = await execul(UPDATE_SQL, params)
  return res;
}


const MAX_ID_SQL = "SELECT MAX(id) as id from history_result";
const MIN_ID_SQL = "SELECT MIN(id) as id from history_result";
const execulGetId = async (type) => {
  let sql = type == "max" ? MAX_ID_SQL : MIN_ID_SQL
  const res = await execul(sql)
  if (res.length) {
    return res[0].id;
  }
  return 0;
}

module.exports = {
  execulInsert,
  execulSelect,
  execulUpdate,
  execulGetId
}