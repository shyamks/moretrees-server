cd moretrees-server
git checkout master
git pull

for pid in `ps aux | grep [s]erver.ts | awk '{print $2}'` ; do kill -9 $pid ; done

printf "After kill command, ts-node processes => "
ps aux | grep '[s]erver.ts'

npm run start:prod &