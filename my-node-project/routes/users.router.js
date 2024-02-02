import express from "express";
import { prisma } from "../models/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlwares/auth.middleware.js";


const router = express.Router();

 /** 사용자 회원가입 API **/
router.post("/sign-up", async (req, res, next) => {
  try{
  const { email, password, name, age, gender, profileImage } = req.body;
  const isExistUser = await prisma.users.findFirst({
    where: { email },
  });

  if (isExistUser) {
    return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
  }

  const hashedPassword = await bcrypt.hash(password, 6);
  const user = await prisma.users.create({
    data: { email, password: hashedPassword },
  });
  const userInfo = await prisma.userInfos.create({
    data: {
      userId: user.userId, 
      name,
      age,
      gender,
      profileImage,
    },
  });

  return res.status(201).json({ message: "회원가입이 완료되었습니다." });
} catch(err){
  next(err);
}
});

/** 로그인 API **/
router.post("/sign-in", async (req, res, next) => {
  const { email, password } = req.body;
  const user = await prisma.users.findFirst({ where: { email } });

  if (!user)
    return res.status(401).json({ message: "존재하지 않는 이메일입니다." });
  else if (!(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

  const token = jwt.sign({ userId: user.userId }, "custom-secret-key");

  res.cookie("authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인 성공" });
});

// 사용자 인증
router.get("/users", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    select: {
      userId: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      userInfos: {
        select: {
          name: true,
          age: true,
          gender: true,
          profileImage: true,
        },
      },
    },
  });

  return res.status(200).json({ data: user });
});

export default router;