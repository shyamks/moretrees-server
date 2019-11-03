cd moretrees-server
ps aux | grep 'node /home/ec2-user' > output.txt
wc -l output.txt
kill -9 $(ps aux | grep 'node /home/ec2-user' | awk 'NR==1{print $2}')
npm run dev