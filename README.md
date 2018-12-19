# NgAgaveSpatialApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.1.3.

This is an template angular application for authenticating to an Agave Tenant via an Agave Nodejs Login service (https://github.com/UH-CI/agave-login-api). And then exposing spatial search for Agave Tenants that have have "value.loc" field with spatial indexing setup.

To configure this application to use your Nodejs Agave Login service you can copy the src/assets/config/config.deploy.json and save it as config.dev.json and modify it for you development environment.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
