**Be very careful with this! For all I know it will suddenly break when the moon is full.**

Create a `config.json` file that looks like this:
```
{
	"localhost": {"port": 8000},
	"domainone.com": {"port": 8001},
	"domaintwo.com": {"port": 8002},
	"domainthree.com": {"host": "192.168.0.11", "port": 3000}
}
```

The keys are domains. The elements are config objects accepted by `net.connect()` in Node.
Might add support for wildcard subdomains later, but for now the code is enough of a clusterfuck as it is.