# Heart to Heart

Heart to Heart is an innovative web application designed to empower individuals to monitor and manage their heart health effectively. This project integrates cutting-edge IoT technology with a user-friendly web interface for real-time monitoring of heart rate and blood oxygen levels.

## Getting Started

These instructions will guide you through setting up and running the Heart to Heart server and website on your local machine for development and testing purposes.

### Prerequisites

Before you start, ensure you have the following installed:

- Node.js (v17.x)
- npm (comes with Node.js)
- HTTP Server for serving static files (install via npm)

If you don't have Node.js installed, download and install it from [Node.js website](https://nodejs.org/). This project requires Node.js version 17.

### Installing HTTP Server

To install the HTTP Server globally on your machine, open your terminal and run:

```
npm install -g http-server
```

### Setting Up the Server

Clone the repository to your local machine:

```
git clone https://github.com/Cphilipp1/HeartBeatDash
```

Navigate to the project directory:
```
cd path/to/heart-to-heart
```
Use Node.js version 17:
```
nvm use 17
```
If you haven't installed Node Version Manager (nvm), follow the instructions at [nvm GitHub repository](https://github.com/nvm-sh/nvm) to install it.

Install the necessary Node.js packages:

```
npm install
```

Start the server:

```
Node server.js
```

After running this command, the Heart to Heart server should be up and running on your local machine.

### Starting the Website

Open a new terminal window or tab.

Navigate to the directory containing your website files within the Heart to Heart project.

Start the HTTP Server on port 8080:

```
http-server -p 8080
```

This will serve your static files (HTML, CSS, JavaScript) on [http://localhost:8080](http://localhost:8080).

Open your browser and go to [http://localhost:8080](http://localhost:8080) to view the Heart to Heart website.

## Usage

- Register as a new user to start monitoring your heart health.
- Log in with your credentials to access real-time data and insights.
- Manage your devices and check your heart health trends on the dashboard.

For more information on how to use specific features, refer to the user guide in the documentation folder.

## Contributing

We welcome contributions to the Heart to Heart project. Please read our contributing guidelines before submitting pull requests to the project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
