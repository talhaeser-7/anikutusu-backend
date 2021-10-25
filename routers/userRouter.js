import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import express from 'express'

import User from '../db/userModel.js'
import tokenModel from '../db/tokenModel.js'

const router = express.Router()
//kayıt olma
router.post('/signup',async (req,res) =>{
    try {
        const {email , password, confirmPassword,firstName,lastName} =req.body

        const userExist = await User.findOne({email})

        if(userExist)
            return res
            .status(400)
            .json({message :'Bu email zaten kullanılıyor.'})
        
        if(password !== confirmPassword)
        return res.status(400).json({message :'Şifreler Eşleşmiyor.'})

        const hashedPassword = await bcrypt.hash(password,5)

        const user = await User.create({
            email,
            name : `${firstName} ${lastName}`,
            password : hashedPassword
        })

        const accessToken = jwt.sign(
            { email : user.email , id:user._id},
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn : '3m'
            }

        )
        const refreshToken = jwt.sign(
            {email: user.email, id:user._id},
            process.env.REFRESH_TOKEN_SECRET
        )
        
        await tokenModel.create({
            userId: user._id,
            refreshToken : refreshToken,
        })
       
        res.status(200).json({user, accessToken})

    } catch (error) {
        console.log(error)
    }

})
//çıkış yapma
router.get('/logout/:id', async (req, res) => {
    try {
      const { id } = req.params
  
     
      await tokenModel.findOneAndUpdate(
        {
          userId: id,
        },
        { refreshToken: null },
        { new: true }
      )
  
      res.status(200).json({ message: 'Başarıyla çıkış yapıldı' })
    } catch (error) {
      res.status(500).json(error)
    }
  })
  //giriş yapma
router.post('/signin', async (req, res) => {
    try {
      const { email, password } = req.body
  
      const user = await User.findOne({ email })
  
      if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' })
  
      const isPasswordCorrect = await bcrypt.compare(password, user.password)
  
      if (!isPasswordCorrect)
        return res
          .status(404)
          .json({ message: 'Giriş bilgilerinizi kontrol edip tekrar deneyin' })
  
      const accessToken = jwt.sign(
        { email: user.email, id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '3m' }
      )
  
      const refreshToken = jwt.sign(
        { email: user.email, id: user._id },
        process.env.REFRESH_TOKEN_SECRET
      )
  
      await tokenModel.findOneAndUpdate(
        { userId: user._id },
        {
          refreshToken: refreshToken,
        },
        { new: true }
      )
  
     
      res.status(200).json({ user, accessToken })
    } catch (error) {
      res.status(500).json(error.message)
    }
  })
  //refresh token
router.get('/refresh/:id', async (req, res) => {
    try {
      const { id } = req.params
      const { refreshToken } = await tokenModel.findOne({ userId: id })
      if (!refreshToken) return res.sendStatus(401)
      
      

      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, x) => { //x => tokenin çözülmüş hali
        if (err) return res.status(403).json(err)
  
        const accessToken = jwt.sign(
          { email: x.email, id: x.id },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '3m' }
        )
  
        res.status(200).json(accessToken)
      })
    } catch (error) {
      console.log(error.message)
    }
  })
export default router