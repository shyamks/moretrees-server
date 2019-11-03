cd moretrees-server
git pull

for pid in `ps aux | grep [s]erver.ts | awk '{print $2}'` ; do kill -9 $pid ; done

echo "After kill command, node processes => "
ps aux | grep '[s]erver.ts'

npm run start:prod