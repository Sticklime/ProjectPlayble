# Navmesh Generator

Генератор навигационной сетки (navmesh) для GLB файлов с использованием Recast Navigation.

## Описание

Утилита для генерации навигационной сетки из GLB файлов. Использует библиотеку `recast-navigation` для построения оптимальной навмеша из геометрии сцены.

## Использование

### Основная команда

```bash
npm run generate-navmesh
```

По умолчанию обрабатывает `Data/ScenePhysics.glb` и создает `Data/ScenePhysics_navmesh.glb`.

### С параметрами

```bash
# Указать входной файл
npm run generate-navmesh -- input.glb

# Указать входной и выходной файлы
npm run generate-navmesh -- input.glb output_navmesh.glb
```

### Примеры

```bash
# Генерация из ScenePhysics.glb
npm run generate-navmesh

# Генерация из Scene.glb
npm run generate-navmesh -- Scene.glb Scene_navmesh.glb
```

## Как работает

1. Загружает GLB файл из папки `Data`
2. Извлекает всю геометрию из сцены (вершины и индексы)
3. Применяет трансформации узлов (позиция, поворот, масштаб)
4. Передает геометрию в Recast Navigation для построения навмеша
5. Генерирует оптимизированную навигационную сетку
6. Сохраняет результат в новый GLB файл

## Параметры Recast Navigation

Генератор использует следующие параметры по умолчанию:

- **cs**: 0.2 - размер ячейки
- **ch**: 0.2 - высота ячейки
- **walkableSlopeAngle**: 45° - максимальный угол наклона
- **walkableHeight**: 2.0 - высота агента
- **walkableClimb**: 0.5 - максимальная высота подъема
- **walkableRadius**: 0.5 - радиус агента
- **maxEdgeLen**: 12 - максимальная длина ребра
- **maxSimplificationError**: 1.3 - максимальная ошибка упрощения
- **minRegionArea**: 8 - минимальная площадь региона
- **mergeRegionArea**: 20 - площадь для слияния регионов
- **maxVertsPerPoly**: 6 - максимум вершин в полигоне
- **detailSampleDist**: 6 - дистанция семплирования деталей
- **detailSampleMaxError**: 1 - максимальная ошибка деталей

## Требования

- Node.js 20.9.0
- Зависимости из `package.json`:
  - `recast-navigation` (^0.43.0)
  - `@gltf-transform/core`
  - `@gltf-transform/extensions`

## Выходной формат

Выходной GLB файл содержит:
- Оптимизированную навигационную сетку (меньше полигонов чем оригинал)
- Метаданные в `extras` узла:
  ```json
  {
    "navmesh": true,
    "generator": "NavmeshGenerator",
    "recastNavigation": true,
    "config": { /* параметры генерации */ },
    "timestamp": "2024-...",
    "stats": {
      "vertices": 1234,
      "triangles": 567,
      "polygons": 89
    }
  }
  ```

## Интеграция в проект

Сгенерированный навмеш можно загрузить в Three.js и использовать с `recast-navigation`:

```typescript
import { init, NavMesh } from 'recast-navigation';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

await init();

const loader = new GLTFLoader();
const gltf = await loader.loadAsync('path/to/navmesh.glb');
const navmeshMesh = gltf.scene.getObjectByName('Navmesh');

// Создание NavMesh из геометрии
const navMesh = new NavMesh();
navMesh.initFromMesh(navmeshMesh);

// Использование для поиска пути
const start = { x: 0, y: 0, z: 0 };
const end = { x: 10, y: 0, z: 10 };
const path = navMesh.computePath(start, end);
```

## Отладка

Генератор выводит подробную информацию:
- Список всех обработанных узлов с количеством вершин и треугольников
- Общее количество геометрии
- Результаты генерации навмеша
- Размеры входного и выходного файлов

При ошибках выводится полный stack trace для диагностики.