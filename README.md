# TQQQ 변동성 비중 (Vercel)

매일 TQQQ 20일 변동성으로 목표 비중 = min(100%, (60% ÷ 변동성)²)을 계산하고, 차이가 10%p 이상이면 사고팔 주수를 알려 주는 앱입니다.
종가는 서버가 Yahoo Finance(실패 시 Stooq)에서 가져오고, 계좌·기록·설정은 Upstash Redis에 저장됩니다.

## 배포 (무한매수 주문표와 별도 프로젝트)
1. 이 폴더를 새 GitHub 저장소로 올립니다 (비공개 권장).
2. Vercel → Add New → Project → 저장소 Import → Deploy.
3. Settings → Environment Variables에 추가합니다 (Production 체크).
   - `KV_REST_API_URL`, `KV_REST_API_TOKEN`: 무한매수 앱과 같은 Upstash DB 값을 그대로 써도 됩니다. 저장 키가 `vt:`로 시작해 서로 겹치지 않습니다.
   - `APP_PASSWORD`: 이 앱의 접속 비밀번호 (영문·숫자·기호)
   - `CRON_SECRET`: 아무 긴 무작위 문자열
4. Deployments → Redeploy.
5. 주소를 열고 비밀번호를 입력하면 종가를 자동으로 가져옵니다.

## 동작
- 평일 22:25 UTC(미국 마감 후)에 종가를 자동 갱신합니다. 화면의 "종가 새로고침"으로 바로 가져올 수도 있습니다.
- 종가를 못 가져오면 "데이터·설정" 탭에서 직접 넣거나 CSV를 붙여 넣을 수 있습니다.
- 한 번에 한 기기에서 쓰세요. 동시에 고치면 나중에 저장한 쪽이 남습니다.
