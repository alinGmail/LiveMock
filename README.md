
<p align="center">
  <img src="https://github.com/alinGmail/LiveMock/blob/main/img/icon_128x128.png"
    srcset="https://github.com/alinGmail/LiveMock/blob/main/img/icon_128x128.png 1x,https://github.com/alinGmail/LiveMock/blob/main/img/icon_128x128@2x.png 2x"
    />
</p>

# About
LiveMock is a comprehensive tool for API development and testing, offering mock data, request proxying, and logging, to streamline workflows and track traffic.

![image](https://github.com/alinGmail/LiveMock/blob/main/img/pic1.png)

# Installation
### 1.clone the project
```
git clone git@github.com:alinGmail/LiveMock.git
```

### 2.install dependencies
```
cd LiveMock
cd frontEnd && yarn install && cd ../backEnd && yarn install && cd ../core && yarn install && cd ../
```


### 3.build the forntEnd code
```
cd frontEnd && yarn build && cd ../
```

### 4.run the project
cd to the project root, then run
```
cd backEnd && yarn start
```
the server will running at http://localhost:9002 


# Quick Start
After installing liveMock, you will be able to access the welcome page (a page to create a project). Simply input the project name and submit the form, and you will be redirected to the dashboard page.

### Creating an Expectation
An expectation consists of several matchers and an action. When a request matches all its matchers, the defined action will be taken, such as responding with a JSON.

To create an expectation, click the "Add Expectation" button. After that, you will see the newly created expectation in the list.

### Creating a Matcher
To create a matcher, click the "Add Matcher" button. Change the matcher to "path start_with /" to match all requests.

### Creating an Action
An action defines what the expectation will do. Currently, two actions are supported: custom response and proxy. 

To create an action, click the "Create Action" button. By default, the action type is set to custom response, but you can change it to proxy. Once the action is created, click on it and input the desired JSON string in the content field. It will be automatically saved.

### Starting the Project
On the top, you will find a green start button. Clicking it will start the project. Furthermore, ensure that your expectation is activated. You can then visit http://localhost:8088 to see the JSON response.

