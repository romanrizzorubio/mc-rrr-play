import {generateAppConfig} from './utils/generate-app-config.js';
import {loadEnvironmentFile} from './utils/load-environment-file.js';

loadEnvironmentFile();
generateAppConfig();
