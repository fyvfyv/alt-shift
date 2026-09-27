import longExpected from '../../server/fixtures/long.expected.json?raw';
import long from '../../server/fixtures/long.sse?raw';
import mediumExpected from '../../server/fixtures/medium.expected.json?raw';
import medium from '../../server/fixtures/medium.sse?raw';
import shortExpected from '../../server/fixtures/short.expected.json?raw';
import short from '../../server/fixtures/short.sse?raw';

const fixtures = {
  short: { sse: short, expected: shortExpected },
  medium: { sse: medium, expected: mediumExpected },
  long: { sse: long, expected: longExpected },
};

type RecordedFixture = { sse: string; deltaCount: number; text: string };

export function recorded(name: keyof typeof fixtures): RecordedFixture {
  const { sse, expected } = fixtures[name];
  return { sse, ...JSON.parse(expected) };
}
