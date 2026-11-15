const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('published entry has inline executable JavaScript and styles with no unresolved development imports', () => {
  const html = fs.readFileSync('ale-v092-fab.html', 'utf8');
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<style>/);
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+rel="stylesheet"/i);
  assert.doesNotMatch(html, /(?:src|href)="\/src\/fab3d\//);
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0][1]));
  assert.match(html, /Permission is hereby granted/);
  assert.match(html, /Three\.js 0\.182\.0/);
});

test('homepage exposes the current simulator, legacy simulator and all existing learning files', () => {
  const home = fs.readFileSync('index.html', 'utf8');
  assert.match(home, /href="ale-v092-fab\.html"/);
  assert.match(home, /href="ale\.html"/);
  assert.match(home, /assets\/ale-v092-chamber\.png/);
  for (const file of ['ale.html', 'learning-hcp.html', 'learning-lecture1.html', 'learning-lecture2.html', 'learning-lecture3.html', 'assets/ale-v092-chamber.png']) {
    assert.ok(fs.statSync(file).size > 0, file);
  }
  assert.match(home, /id="smaEntry"/);
  assert.match(home, /href="learning-lecture3.html#chapter-1"/);
});
