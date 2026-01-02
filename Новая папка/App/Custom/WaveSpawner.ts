import { Eventail } from "eventail";
import { AnchorKeeper } from "Generated/AnchorKeeper";
import type { Camera, Quaternion } from "three";
import { Vector3 } from "three";

const TEMP_POSITION = new Vector3();

interface AnchorDescriptor {
  position: Vector3;
  quaternion: Quaternion;
}

export interface WaveSpawnerDescriptor {
  waitForContinue: boolean;
  delayBeforeWave: number;
  delayBetweenSpawns: number;
  count: number;
}

export enum WaveSpawnerEvent {
  WAVE_START = "waveStart",
  WAVE_COMPLETE = "waveComplete",
  ALL_WAVES_COMPLETE = "allWavesComplete",
}

export abstract class WaveSpawner<
  T extends WaveSpawnerDescriptor,
> extends Eventail {
  private currentWaveIndex = 0;
  private currentCount = 0;
  private waitingForContinue = true;
  protected static readonly spawns: AnchorDescriptor[] = (() => {
    const result: AnchorDescriptor[] = [];
    for (const [key, value] of Object.entries(AnchorKeeper.Scene)) {
      if (key.includes("ANC_Spawn")) {
        result.push(value);
      }
    }
    return result;
  })();

  constructor(protected readonly descriptors: T[]) {
    super();
  }

  public continue() {
    this.waitingForContinue = false;
    this.startWave();
  }

  protected abstract spawn(
    descriptor: T,
    spawn: { position: Vector3; quaternion: Quaternion },
  ): void;

  protected abstract selectSpawn(descriptor: T): AnchorDescriptor;

  private startWave() {
    if (this.currentWaveIndex >= this.descriptors.length) {
      return;
    }

    const wave = this.descriptors[this.currentWaveIndex] as T;
    this.currentCount = 0;

    setTimeout(() => {
      if (!this.waitingForContinue) {
        this.spawnWave(wave);
      }
    }, wave.delayBeforeWave * 1000);
  }

  private spawnWave(wave: T) {
    this.emit(WaveSpawnerEvent.WAVE_START);

    let spawnedCount = 0;

    const spawnNext = () => {
      if (this.waitingForContinue || spawnedCount >= wave.count) {
        return;
      }

      const spawn = this.selectSpawn(wave);

      this.spawn(wave, spawn);
      this.currentCount += 1;
      spawnedCount += 1;

      setTimeout(spawnNext, wave.delayBetweenSpawns * 1000);
    };

    spawnNext();
  }

  private onWaveComplete() {
    this.currentWaveIndex += 1;

    if (this.currentWaveIndex >= this.descriptors.length) {
      this.emit(WaveSpawnerEvent.ALL_WAVES_COMPLETE);
      return;
    }

    this.emit(WaveSpawnerEvent.WAVE_COMPLETE);
    const wave = this.descriptors[this.currentWaveIndex] as T;

    if (wave.waitForContinue) {
      this.waitingForContinue = true;
    } else {
      this.startWave();
    }
  }

  protected decrementCount() {
    this.currentCount = Math.max(0, this.currentCount - 1);

    if (this.currentCount === 0) {
      this.onWaveComplete();
    }
  }

  protected static isInView(position: Vector3, camera: Camera): boolean {
    const clipSpacePosition = TEMP_POSITION.copy(position).project(camera);
    return (
      clipSpacePosition.x >= -1 &&
      clipSpacePosition.x <= 1 &&
      clipSpacePosition.y >= -1 &&
      clipSpacePosition.y <= 1 &&
      clipSpacePosition.z >= -1 &&
      clipSpacePosition.z <= 1
    );
  }
}
