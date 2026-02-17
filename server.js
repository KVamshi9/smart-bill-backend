require("dotenv").config()
const express = require("express")
const mysql = require("mysql2/promise")
const cors = require("cors")
const cron = require("node-cron")
const twilio = require("twilio")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const app = express()
app.use(cors())
app.use(express.json())

// db creation

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT),
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

// whatsapp twilio

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const sendWhatsApp = async (phone, text) => {
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phone}`,
      body: text,
    })
  } catch (error) {
    console.log("Twilio Error:", error.message)
  }
}

// auth middleware

const authenticateToken = async (request, response, next) => {
  let jwtToken
  const authHeader = request.headers["authorization"]

  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1]
  }

  if (jwtToken === undefined) {
    response.status(401)
    response.send("Invalid Access Token")
  } else {
    jwt.verify(jwtToken, process.env.JWT_SECRET, async (error, payload) => {
      if (error) {
        response.status(401)
        response.send("Invalid Access Token")
      } else {
        request.userId = payload.userId
        next()
      }
    })
  }
}

// register

app.post("/users/", async (request, response) => {

  const {name,email,phone,password} = request.body

  let checkQuery = `
    SELECT * FROM users WHERE email='${email}'
  `
  let [dbUser] = await db.execute(checkQuery)

  if (dbUser.length !== 0) {
    response.status(400)
    response.send("User already exists")
  } else {

    const hashedPassword = await bcrypt.hash(password,10)

    let createQuery = `
      INSERT INTO 
        users (name,email,phone,password_hash)
      VALUES 
        ('${name}',
        '${email}',
        '${phone}',
        '${hashedPassword}'
        )`

    await db.execute(createQuery)
    response.send("User created successfully")
  }
})

// login

app.post("/login/", async (request, response) => {

  const {email,password} = request.body

  let query = `
    SELECT * FROM users WHERE email='${email}'
  `
  let [dbUser] = await db.execute(query)

  if (dbUser.length === 0) {
    response.status(400)
    response.send("Invalid User")
  } else {

    let user = dbUser[0]

    const isPasswordMatched = await bcrypt.compare(password,user.password_hash)

    if (isPasswordMatched === true) {

      const payload = { userId: user.id }

      const jwtToken = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"7d"})

      response.send({jwtToken})

    } else {
      response.status(400)
      response.send("Invalid Password")
    }
  }
})


// CREATE BILL

app.post('/bills', authenticateToken, async (request, response) => {

  const {title, amount, due_day, reminder_time, phone} = request.body

  let createBillQuery = `
    INSERT INTO bills
    (title, amount, due_day, reminder_time, phone, message, user_id)
    VALUES (
      '${title}',
      '${amount}',
      '${due_day}',
      '${reminder_time}',
      '${phone}',
      'EMI Reminder',
      '${request.userId}'
    );
  `

  try {
    await db.execute(createBillQuery)
    response.status(200).send('Bill created successfully')
  } catch {
    response.status(500).send('Error creating bill')
  }
})

// get bill

app.get('/bills', authenticateToken, async (request, response) => {

  let getBillsQuery = `
    SELECT * FROM bills
    WHERE user_id='${request.userId}'
    ORDER BY due_day ASC;
  `

  try {
    let [billsList] = await db.execute(getBillsQuery)
    response.status(200).send(billsList)
  } catch {
    response.status(500).send('Error fetching bills')
  }
})

// update bill

app.put('/bills/:id', authenticateToken, async (request, response) => {

  const {id} = request.params
  const {title, amount, due_day, reminder_time, phone, message} = request.body

  let updateBillQuery = `
    UPDATE bills
    SET 
      title='${title}',
      amount='${amount}',
      due_day='${due_day}',
      reminder_time='${reminder_time}',
      phone='${phone}',
      message='${message}'
    WHERE id='${id}' AND user_id='${request.userId}';
  `

  try {
    await db.execute(updateBillQuery)
    response.status(200).send('Bill updated successfully')
  } catch {
    response.status(500).send('Error updating bill')
  }
})

// delete

app.delete('/bills/:id', authenticateToken, async (request, response) => {

  const {id} = request.params

  let deleteBillQuery = `
    DELETE FROM bills
    WHERE id='${id}' AND user_id='${request.userId}';
  `

  try {
    await db.execute(deleteBillQuery)
    response.status(200).send('Bill deleted successfully')
  } catch {
    response.status(500).send('Error deleting bill')
  }
})

// cron job

cron.schedule("* * * * *", async () => {
  try {

    console.log(`cron tick : ${new Date()}`)

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    )

    const todayDay = now.getDate()
    const currentTime = now.toTimeString().slice(0,5)
    const monthKey = now.toISOString().slice(0,7)

    let [bills] = await db.execute(`
      SELECT *
      FROM bills
      WHERE due_day='${todayDay}'
      AND reminder_time='${currentTime}'
      AND (last_notified_month IS NULL OR last_notified_month!='${monthKey}')
    `)

    for (let bill of bills) {

      let message = `Reminder
      Bill: ${bill.title}
      Amount: ₹${bill.amount}
      Due Today`

      await sendWhatsApp(bill.phone, message)

      await db.execute(`
        UPDATE bills
        SET last_notified_month='${monthKey}'
        WHERE id='${bill.id}'
      `)

      console.log("Sent:", bill.title)
    }

  } catch (error) {
    console.log("Cron Error:", error.message)
  }
})


// api start
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
