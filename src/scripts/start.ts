// Ensure environment variables are read.
import '../config/env';
import chalk from 'chalk';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
// @ts-ignore
import clearConsole from 'react-dev-utils/clearConsole';
// @ts-ignore
import openBrowser from 'react-dev-utils/openBrowser';
// @ts-ignore
import { choosePort, createCompiler, prepareProxy, prepareUrls } from 'react-dev-utils/WebpackDevServerUtils';
import createDevServerConfig from '../config/dev-server';
import { getConfig } from '../utils';

export type StartOptions = {
  config: string;
};

export default ({ config: configPath }: StartOptions) => {
  // Do this as the first thing so that any code reading it knows the right env.
  process.env.BABEL_ENV = 'development';
  process.env.NODE_ENV = 'development';

  // Grab medpack config
  const { config, paths } = getConfig(configPath);

  const isInteractive = process.stdout.isTTY;

  // Tools like Cloud9 rely on this.
  const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10) || 8080;
  const HOST = process.env.HOST || '0.0.0.0';

  if (process.env.HOST) {
    console.log(
      chalk.cyan(`Attempting to bind to HOST environment variable: ${chalk.yellow(chalk.bold(process.env.HOST))}`)
    );
    console.log(`If this was unintentional, check that you haven't mistakenly set it in your shell.`);
    console.log(`Learn more here: ${chalk.yellow('http://bit.ly/CRA-advanced-config')}`);
    console.log();
  }

  // Makes the script crash on unhandled rejections instead of silently
  // ignoring them. In the future, promise rejections that are not handled will
  // terminate the Node.js process with a non-zero exit code.
  process.on('unhandledRejection', err => {
    throw err;
  });

  choosePort(HOST, DEFAULT_PORT)
    .then((port: number) => {
      if (port == null) {
        // We have not found a port.
        return;
      }
      const pkg = require(paths.appPackageJson);

      const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
      const urls = prepareUrls(protocol, HOST, port);
      const appName = pkg.name;

      // Create a webpack compiler that is configured with custom messages.
      const compiler = createCompiler({ webpack, config, appName, urls, useYarn: paths.useYarn });

      // Load proxy config
      const proxySetting = pkg.proxy;
      const proxyConfig = prepareProxy(proxySetting, paths.appPublic);

      // Serve webpack assets generated by the compiler over a web server.
      const serverConfig = createDevServerConfig({
        config,
        paths,
        proxy: proxyConfig,
        allowedHosts: urls.lanUrlForConfig,
      });

      const devServer = new WebpackDevServer(compiler, serverConfig);

      // Launch WebpackDevServer.
      devServer.listen(port, HOST, (err: Error | undefined) => {
        if (err) {
          return console.log(err);
        }
        if (isInteractive) {
          clearConsole();
        }
        console.log(chalk.cyan('Starting the development server...\n'));
        openBrowser(urls.localUrlForBrowser);
      });

      const exit = () => {
        devServer.close();
        process.exit();
      };

      process.on('SIGINT', exit);
      process.on('SIGTERM', exit);
    })
    .catch((err: Error) => {
      if (err && err.message) {
        console.log(err.message);
      }
      process.exit(1);
    });
};
