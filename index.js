import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import memoryRouter from "./routers/memoryRouters.js"
import userRouter from "./routers/userRouter.js"
import cookieParser from "cookie-parser"
dotenv.config()

const app = express()
app.use(cors({credentials: true, origin: 'https://anikutusu-talha.netlify.app/'}))
app.use(express.json({limit :'30mb'}))
app.use('/memories',memoryRouter)
app.use('/users',userRouter)


app.listen(process.env.PORT,()=>{
   mongoose
   .connect(process.env.MONGO_URI,{
       useNewUrlParser : true,
       useUnifiedTopology : true,
       
   })
   .then(() => console.log("db bağlantısı başarılı"))
   .catch((err) =>console.log(err.message))
});