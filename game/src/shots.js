// shots.js — deterministic screenshot staging.
// One job: given ?shot=..., put the game into a fixed, photogenic state
// so the three screenshots are reproducible.
export function stageShot(game, shot) {
  if (shot === 'start') {
    game.screen = 'title';
    return;
  }
  if (shot === 'play') {
    // Mid-level: player deep in the hall, cones sweeping, one ledger taken,
    // exit still locked — the complete stealth game at a glance.
    game.screen = 'playing';
    game.player.x = 470;
    game.player.y = 470;
    game.player.faceX = 1; game.player.faceY = 0;
    game.level.intel[0].taken = true;
    game.guards[0].x = 330; game.guards[0].y = 380; game.guards[0].facing = Math.PI;
    game.guards[0].suspicion = 12; game.guards[0].state = 'patrol';
    game.guards[0].investigate = null;
    game.guards[1].x = 950; game.guards[1].y = 300; game.guards[1].facing = Math.PI;
    game.guards[1].suspicion = 8;
    game.detection = 12;
    game.level.elapsed = 87;
    return;
  }
  if (shot === 'alert') {
    // Near-detection: alarm moment, guard closing in, meter nearly full.
    game.screen = 'playing';
    game.player.x = 700;
    game.player.y = 570;
    game.player.running = true;
    game.player.faceX = -1; game.player.faceY = 0;
    game.level.intel[0].taken = true;
    game.level.intel[1].taken = true;
    game.level.exitOpen = true;
    game.guards[0].x = 500; game.guards[0].y = 500; game.guards[0].facing = 0.32;
    game.guards[0].suspicion = 100; game.guards[0].state = 'spotted';
    game.guards[0].lastSeen = { x: 700, y: 570 };
    game.guards[1].x = 1000; game.guards[1].y = 600; game.guards[1].facing = Math.PI * 0.85;
    game.guards[1].suspicion = 72; game.guards[1].state = 'suspicious';
    game.guards[1].investigate = { x: 700, y: 570 };
    game.detection = 100;
    game.anySpotted = true;
    game.shake = 5;
    game.level.elapsed = 154;
    return;
  }
  game.screen = 'title';
}
