// Логика управления событиями

import 'Broadcast';
import 'Broadcast.Dom';

// Движок игры

import 'Game';
import 'Game.Three';
import 'Game.Debug';

// Логика работы экранов

import 'Screen';
import 'Screen.Three';
import 'Screen.Text';
import 'Screen.Dom';
import 'Screen.VisualEffects';
import 'Screen.CachedObjects';
import 'Screen.Underscore';

// Дополнительные Three плагины

import * as THREE from 'three';

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

window.THREE = THREE;
window.FBXLoader = FBXLoader;
window.GLTFLoader = GLTFLoader;

// Собственные плагины THREE которых нет в npm

import ThreeGUI from 'ThreeGUI';

window.ThreeGUI = ThreeGUI;

// Стартовый файл игры

import 'App';

// Экраны

import 'Screens/Gameplay';
import 'Screens/CallToAction';
// import 'Screens/Tutorial';
// import 'Screens/EndCard';
// import 'Screens/Banner';

// Настройки
// Подгрузим настройки из локального файла
import LocalSettings from "default.json";
// Если игра запускается не на продакшене и не в дашборде - используем эти локально созданные настройки
// иначе используем сформированный дашбордом глобальный объект Settings, который должен будет уже присутствовать глобально
if (!window["MraidSDK"]) window.Settings = LocalSettings;

// Логика сервисов (общение с сервером)

// import 'Service';
// import 'Service.Socket';
// import 'Service.Request';

// Сервисы

// import Server from 'Services/Server';

// Подключаемся к серверу
// Server.connect();

import Loader from 'Loader';
Loader.start();

