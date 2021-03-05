const client = require('stratum-client');
const http = require('http');
const BigInt = require("big-integer");
const chalk = require('chalk');

const { ArgumentParser } = require('argparse');
const { version } = require('./package.json');

const parser = new ArgumentParser({
    description: 'Ergo Stratum mining pool\'s proxy'
});

parser.add_argument('-v', '--version', {action: 'version', version});
parser.add_argument('-s', '--server', {help: 'server ip address', required: true});
parser.add_argument('-p', '--port', {help: 'server listening port', required: true});
parser.add_argument('-u', '--worker', {help: 'worker name', required: true});
parser.add_argument('-w', '--password', {help: 'worker password', default: 'x'});
parser.add_argument('-l', '--listen', {help: 'listening port', default: 3000});
args = parser.parse_args();

jobs = [];
acceptedShares = 0;
rejectedShares = 0;
startTime = new Date();

const showStats = () => {
    let currentTime = new Date();
    let timeDiff = (currentTime - startTime) / 1000;
    let timeHours = Math.floor(timeDiff / 3600);
    let timeMinutes = Math.floor((timeDiff - (timeHours * 3600)) / 60);
    if(timeMinutes < 10) {
        timeMinutes = `0${timeMinutes}`;
    }
    console.log(chalk.cyanBright(`\n----------------------------------------`));
    console.log(chalk.cyanBright(`Accepted shares: ${acceptedShares}`));
    console.log(chalk.cyanBright(`Rejected shares: ${rejectedShares}`));
    console.log(chalk.cyanBright(`Time elapsed: ${timeHours}:${timeMinutes}`));
    console.log(chalk.cyanBright(`----------------------------------------\n`));
}

const Client = client({
    server: args.server,
    port: args.port,
    worker: args.worker,
    password: args.password,
    autoReconnectOnError: true,
    onConnect: () => {
        console.log(chalk.greenBright('[CONNECTION] Connected to server.'))
        setInterval(() => { showStats() }, 1000 * 60);
    },
    onClose: () => {
        while (jobs.length)
            jobs.pop()
        console.log(chalk.red('[CONNECTION] Disconnected from server.'))
    },
    onError: (error) => {
        console.log(chalk.red(`[ERROR] ${error.message}`))
    },
    onAuthorizeSuccess: () => {
        console.log(chalk.greenBright('[WORKER] Worker authorized.'))
    },
    onAuthorizeFail: () => {
        console.log(chalk.red('[WORKER] Unable to authorize worker.'))
    },
    onNewDifficulty: (newDiff) => {
        console.log(chalk.cyanBright(`[DIFFICULTY] New difficulty: ${newDiff}`))
    },
    onSubscribe: (subscribeData) => {
        console.log(chalk.cyanBright(`[SUBSCRIBE] Nonce: ${subscribeData.extraNonce1}, nonce size: ${subscribeData.extraNonce2Size}`))
    },
    onNewMiningWork: (newWork) => {
        console.log('[JOB]', `New job received. Job ID: ${newWork.jobId}, difficulty: ${newWork.miningDiff}, height: ${newWork.prevhash}`);
        // options.client.write(
        //     submitWork.replace("<worker.name>", options.worker_name)
        //         .replace("<jobID>", options.job_id)
        //         .replace("<ExtraNonce2>", options.extranonce2)
        //         .replace("<ntime>", options.ntime)
        //         .replace("<nonce>", options.nonce));

        if (newWork.clean_jobs) {
            while (jobs.length)
                jobs.pop()
        }
        let found = false;
        for(let i=0; i<jobs.length; i++){
            let job = jobs[i];
            if(newWork.coinb1 === job.coinb1 && newWork.extraNonce1 === job.extraNonce1){
                found = true;
                break;
            }
        }
        if(!found) {
            jobs.push(newWork);
        }
    },
    onSubmitWorkSuccess: (error, result) => {
        acceptedShares += 1;
        console.log(chalk.greenBright('[SHARE] Share accepted.'))
    },
    onSubmitWorkFail: (error, result) => {
        rejectedShares += 1;
        console.log(chalk.red(`[SHARE] Share rejected. ${error}`))
    },
});

const handle_mining_candidate = (request, response) => {
    response.writeHead(200, {'Content-Type': 'application/json'});
    var job = jobs[0];
    if (job) {
        var res = JSON.stringify({
            msg: job.coinb1,
            b: "<b_value>",
            extraNonce1: job.extraNonce1,
            extraNonce2Size: job.extraNonce2Size,
            height: job.prevhash
        });
        const b_value = BigInt(job.miningDiff).equals(BigInt(0)) ? BigInt(job.nbits) : (BigInt(job.nbits).minus(BigInt(1))).multiply(BigInt(job.miningDiff));
        res = res.replace("\"<b_value>\"",
            b_value.toString()
        );
    } else {
        res = "{}";
    }
    response.write(res);
    response.end();
}

const handle_job_completed = (request, response) => {
    response.writeHead(200, {'Content-Type': 'application/json'});
    jobs.splice(0, 1);
    response.write('{"status": "OK"}');
    response.end();
}

const handle_submit_solution = (request, response) => {
    var job = jobs[0];
    if(job) {
        var data = "";
        request.on('data', function (chunk) {
            data += chunk;
        });
        request.on('end', function () {
            data = JSON.parse(data);
            var nonce = data.n;
            var extraNonce2 = nonce.substr(job.extraNonce1.length)
            Client.submit({
                "worker_name": args.worker,
                "job_id": job.jobId,
                "nonce": nonce,
                "extranonce2": extraNonce2
            })
            var res = JSON.stringify({
                status: "OK",
            });
            response.write(res);
            response.end()
        });
    }else{
        response.write('{"status": "fail"}');
    }
}

const server = http.createServer((request, response) => {
    // You pass two more arguments for config and middleware
    // More details here: https://github.com/vercel/serve-handler#options
    switch (request.url) {
        case '/mining/candidate':
            handle_mining_candidate(request, response);
            break;
        case '/mining/solution':
            handle_submit_solution(request, response);
            break;
        case '/mining/job/completed':
            handle_job_completed(request, response);
            break;
        default:
            response.write('{"status": "fail"}');
            response.end();
    }
})

server.listen(args.listen, () => {
    console.log(chalk.yellowBright('Ergo Stratum Proxy'));
    console.log(chalk.yellowBright(`Running at http://localhost:${args.listen}`));
    console.log(chalk.yellowBright('--------------------------------------------------\n'));
});

