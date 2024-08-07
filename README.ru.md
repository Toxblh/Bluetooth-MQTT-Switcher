# Bluetooth-MQTT-Switcher
[![ru](https://img.shields.io/badge/%D1%8F%D0%B7%D1%8B%D0%BA-%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9%20%F0%9F%87%B7%F0%9F%87%BA-white)](README.ru.md)
[![en](https://img.shields.io/badge/lang-English%20%F0%9F%87%AC%F0%9F%87%A7-white)](README.md)

## Описание

<img src="src/assets/logo.png" align="right" title="Bluetooth MQTT Switcher" width="110" height="110">

Bluetooth-MQTT-Switcher - это программа, позволяющая легко переключать Bluetooth устройства между устройствами, которые не поддерживают Multipoint и имеют Bluetooth версии ниже 5.0. Программа перехватывает сопряженные устройства, позволяя осуществлять переключение без необходимости разрыва и нового установления соединений вручную.

## Требования

Для работы программы требуется MQTT сервер в домашней сети. Поддерживаются операционные системы Linux и macOS. Для macOS требуется установка утилиты blueutil.

## Установка

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

Для установки blueutil на macOS используйте Homebrew:

```sh
brew install blueutil
```


## Быстрый старт

### Развертывание MQTT сервера

Для быстрого развертывания MQTT сервера можно использовать Docker. Ниже приведен пример, как это сделать:

1.	Установите Docker, если он еще не установлен. Инструкции по установке можно найти [здесь](https://docs.docker.com/get-docker/).
2.	Запустите MQTT сервер с помощью команды:

```sh
docker run -d --name mosquitto -p 1883:1883 eclipse-mosquitto
```

Этот командный пример развернет Eclipse Mosquitto - легкий и популярный MQTT брокер.

### Настройка и запуск программы

После установки необходимых компонентов, запустите и настройте программу. Убедитесь, что ваш MQTT сервер работает и доступен в вашей домашней сети.

## Использование

Для использования программы, следуйте в настройки, чтобы указать адрес вашего MQTT сервера.

## Поддержка

Если у вас возникли вопросы или проблемы, пожалуйста, создайте issue в репозитории проекта на GitHub. Если у вас есть предложения по улучшению документации, не стесняйтесь отправлять pull requests!
