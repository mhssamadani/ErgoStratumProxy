const client = require('stratum-client');
const http = require('http');
const BigInt = require("big-integer");

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

const Client = client({
    server: args.server,
    port: args.port,
    worker: args.worker,
    password: args.password,
    autoReconnectOnError: true,
    onConnect: () => {
        console.log('Connected to server')
    },
    onClose: () => {
        console.log('Connection closed')
    },
    onError: (error) => {
        console.log('Error', error.message)
    },
    onAuthorizeSuccess: () => {
        console.log('Worker authorized')
    },
    onAuthorizeFail: () => {
        console.log('WORKER FAILED TO AUTHORIZE OH NOOOOOO')
    },
    onNewDifficulty: (newDiff) => {
        console.log('New difficulty', newDiff)
    },
    onSubscribe: (subscribeData) => {
        console.log('[Subscribe]', subscribeData)
    },
    onNewMiningWork: (newWork) => {
        console.log('[New Work]', newWork)
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
        console.log("Yay! Our work was accepted!")
    },
    onSubmitWorkFail: (error, result) => {
        console.log("Oh no! Our work was refused because: " + error)
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
        const b_value = BigInt(job.miningDiff).equals(BigInt(0) ? BigInt(job.nbits) : (BigInt(job.nbits).minus(BigInt(1))).multiply(BigInt(job.miningDiff));
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
    console.log('Running at http://localhost:' + args.listen);
});

