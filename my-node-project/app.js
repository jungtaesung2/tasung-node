import express from 'express';
import cookieParser from 'cookie-parser';
import UserRouter from './routes/users.router.js';
import LogMiddleware from './middlwares/log.middleware.js';
import ErrorHandlingMiddleware from './middlwares/error-handling.middleware.js';



const app = express();
const PORT = 3018;

const ACCESS_TOKEN_SECRET_KEY = `HangHae99`; 
const REFRESH_TOKEN_SECRET_KEY = `Sparta`; 

app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use('/api', [UserRouter])


app.get('/', (req, res) => {
  return res.status(200).send('Hello Token!');
});

const tokenStorage = {};

app.post('/tokens', async(req, res) =>{
  const{id} = req.body;
  const accessToken = createAccessToken(userInfo.id);
  const refreshToken = jwt.sign({id : id}, REFRESH_TOKEN_SECRET_KEY, {expiresIn : '7d'});

  tokenStorage[refreshToken] = {
    id: id, 
    ip: req.ip, 
    userAgent: req.headers['user-agent'], 
  };

  res.cookie('accessToken', accessToken); 
  res.cookie('refreshToken', refreshToken); 

  return res
    .status(200)
    .json({ message: 'Token이 정상적으로 발급되었습니다.' });
});

//엑세스 토큰 검증 API
app.get('/tokens/validate', (req, res) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res
      .status(400)
      .json({ errorMessage: 'Access Token이 존재하지 않습니다.' });
  }

  const payload = validateToken(accessToken, ACCESS_TOKEN_SECRET_KEY);
  if (!payload) {
    return res
      .status(401)
      .json({ errorMessage: 'Access Token이 유효하지 않습니다.' });
  }

  const { id } = payload;
  return res.json({
    message: `${id}의 Payload를 가진 Token이 성공적으로 인증되었습니다.`,
  });
});

function validateToken(token, secretKey) {
  try {
    const payload = jwt.verify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}

function createAccessToken(id) {
  return jwt.sign({id}, ACCESS_TOKEN_SECRET_KEY, {expiresIn: '12h'});
}

//엑세스 토큰 재발급 API
app.post('/tokens/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken)
    return res
      .status(400)
      .json({ errorMessage: 'Refresh Token이 존재하지 않습니다.' });

  const payload = validateToken(refreshToken, REFRESH_TOKEN_SECRET_KEY);
  if (!payload) {
    return res
      .status(401)
      .json({ errorMessage: 'Refresh Token이 유효하지 않습니다.' });
  }

  const userInfo = tokenStorage[refreshToken];
  if (!userInfo)
    return res.status(419).json({
      errorMessage: 'Refresh Token의 정보가 서버에 존재하지 않습니다.',
    });

  const newAccessToken = createAccessToken(userInfo.id);

  res.cookie('accessToken', newAccessToken);
  return res.json({ message: 'Access Token을 새롭게 발급하였습니다.' });
});

app.use(ErrorHandlingMiddleware);
app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});







