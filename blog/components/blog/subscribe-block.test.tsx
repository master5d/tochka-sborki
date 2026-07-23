import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SubscribeBlock, submitSubscribe, SUBSCRIBE_URL } from "./subscribe-block";

const jsonResponse = (body: unknown): Response =>
  ({ ok: true, json: async () => body }) as unknown as Response;

const badResponse = (): Response =>
  ({ ok: false, json: async () => ({}) }) as unknown as Response;

type FetchMock = ReturnType<typeof vi.fn> & typeof fetch;

describe("SubscribeBlock render", () => {
  it("renders the RU form with an off-screen honeypot", () => {
    const html = renderToStaticMarkup(<SubscribeBlock locale="ru" />);
    expect(html).toContain("Подписаться");
    expect(html).toContain('type="email"');
    expect(html).toContain('name="website"');
    expect(html).toContain('tabindex="-1"');
  });

  it("renders the EN form", () => {
    const html = renderToStaticMarkup(<SubscribeBlock locale="en" />);
    expect(html).toContain("Subscribe");
    expect(html).toContain('name="website"');
  });

  it("RU component threads lang=ru into the form", () => {
    const html = renderToStaticMarkup(<SubscribeBlock locale="ru" />);
    expect(html).toContain('name="lang"');
    expect(html).toContain('value="ru"');
  });

  it("EN component threads lang=en into the form", () => {
    const html = renderToStaticMarkup(<SubscribeBlock locale="en" />);
    expect(html).toContain('name="lang"');
    expect(html).toContain('value="en"');
  });
});

describe("submitSubscribe", () => {
  it("POSTs {email, website, lang} to the synergify endpoint and resolves done on {ok:true}", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true })) as FetchMock;
    const result = await submitSubscribe("reader@example.com", "", "ru", fetchMock);
    expect(result).toBe("done");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(SUBSCRIBE_URL);
    expect(url).toBe("https://synergify.com/api/subscribe");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ email: "reader@example.com", website: "", lang: "ru" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("passes lang=en through to the request body", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true })) as FetchMock;
    await submitSubscribe("reader@example.com", "", "en", fetchMock);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ email: "reader@example.com", website: "", lang: "en" });
  });

  it("resolves already on {ok:true, already:true}", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true, already: true })) as FetchMock;
    const result = await submitSubscribe("reader@example.com", "", "ru", fetchMock);
    expect(result).toBe("already");
  });

  it("resolves error on a 400 response", async () => {
    const fetchMock = vi.fn(async () => badResponse()) as FetchMock;
    const result = await submitSubscribe("bad", "", "ru", fetchMock);
    expect(result).toBe("error");
  });

  it("resolves error on network failure", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("network down");
    }) as FetchMock;
    const result = await submitSubscribe("reader@example.com", "", "ru", fetchMock);
    expect(result).toBe("error");
  });

  it("does NOT call fetch when the honeypot is filled", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true })) as FetchMock;
    const result = await submitSubscribe("bot@example.com", "http://spam.example", "ru", fetchMock);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe("done"); // silent success — no signal to the bot
  });
});
