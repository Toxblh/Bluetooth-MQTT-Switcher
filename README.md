# Bluetooth-MQTT-Switcher
[![ru](https://img.shields.io/badge/%D1%8F%D0%B7%D1%8B%D0%BA-%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9%20%F0%9F%87%B7%F0%9F%87%BA-white)](README.ru.md)
[![en](https://img.shields.io/badge/lang-English%20%F0%9F%87%AC%F0%9F%87%A7-white)](README.md)

## Description

<img src="src/assets/logo.png" align="right" title="Bluetooth MQTT Switcher" width="110" height="110">

Bluetooth-MQTT-Switcher is a program that allows you to easily switch Bluetooth devices between devices that do not support Multipoint and have Bluetooth versions below 5.0. The program intercepts paired devices, enabling switching without the need to manually disconnect and reconnect.

## Requirements

To run the program, an MQTT server is required in your home network. The supported operating systems are Linux and macOS. For macOS, the installation of the blueutil utility is required.

## Installation

```sh
git clone https://github.com/Toxblh/Bluetooth-MQTT-Switcher
cd Bluetooth-MQTT-Switcher
yarn
# dev mode:
yarn start 
# build pack:
yarn package
# folder with app created ./bluetooth-mqtt-switcher-xXx-xXx
```

### MacOS

To install blueutil on macOS, use Homebrew:

```sh
brew install blueutil
```

## Quick Start

### Deploying an MQTT Server

To quickly deploy an MQTT server, you can use Docker. Here is an example of how to do it:

1.	Install Docker if it is not already installed. Installation instructions can be found [here](https://docs.docker.com/get-docker/).
2.	Run the MQTT server using the following command:

```sh
docker run -d --name mosquitto -p 1883:1883 eclipse-mosquitto
```

This command will deploy Eclipse Mosquitto, a lightweight and popular MQTT broker.

### Setting up and Running the Program

After installing the necessary components, configure and run the program. Ensure that your MQTT server is running and accessible in your home network.

## Usage

To use the program, follow the setup instructions to specify the address of your MQTT server.

## Support

If you have any questions or issues, please create an issue in the project’s GitHub repository.