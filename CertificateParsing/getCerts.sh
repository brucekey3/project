if [ $# -ne 1 ]
then
	echo "Need 1 input of file name"
	exit -1
fi

file=$1
inputFile="tmpFile.pem"
outputFile="results.csv"
echo "Site/issC/issST/issL/issO/issCN/subjC/subjST/subjL/subjO/subjCN/algorithm/how long issued for/time since issued/time til expires\n" >> $outputFile
while IFS= read -r line
do
    # display $line or do somthing with $line
	printf '%s\n' "$line"
	serverPort=$line
	res=$(openssl s_client -showcerts -servername $serverPort -connect $serverPort </dev/null 2>/dev/null  | openssl x509 -outform PEM > $inputFile) 
	if [ $? -ne 0 ]
	then
		continue
	fi
	printf "%s" "$serverPort/" >> $outputFile
	./run $inputFile $outputFile
done <"$file"
