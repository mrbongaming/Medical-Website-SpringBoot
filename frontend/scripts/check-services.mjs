import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const catalog = await server.ssrLoadModule("/src/data/serviceCatalog.js");
  const flow = await server.ssrLoadModule("/src/data/serviceFlow.js");
  const schedule = await server.ssrLoadModule("/src/data/mockSchedule.js");
  const { mockUser } = await server.ssrLoadModule("/src/data/mockAccount.js");
  assert.equal(catalog.serviceCatalog.length, 16);
  assert.equal(catalog.serviceItems.length, 60);
  assert.equal(catalog.serviceCatalog.filter((group) => group.external).length, 1);
  const external = catalog.serviceCatalog.find((group) => group.external);
  assert.equal(external.href, "https://www.nhathuocankhang.com/");
  for (const group of catalog.serviceCatalog.filter((entry) => !entry.external)) {
    assert.equal(catalog.getItems(group.slug).length, 4, group.slug);
  }
  assert.equal(new Set(catalog.serviceItems.map((item) => catalog.detailPath(item))).size, 60);
  for (const item of catalog.serviceItems) {
    assert.equal(catalog.getItem(item.serviceSlug, item.slug), item);
    await access(path.join(process.cwd(), "public", item.image));
    let state = flow.initialSelection(item, mockUser);
    assert.ok(flow.validateStep(item, state, "options"));
    const provider = flow.availableProviders(item, state.specialtyId)[0];
    assert.ok(provider, item.name);
    state = { ...state, providerId: provider.id, company: "Demo Company", staff: "25", address: "Demo address", documents: true };
    assert.equal(flow.validateStep(item, state, "options"), "", item.name);
    state.date = schedule.firstBookingDate();
    const slots = schedule.getSlots(item.flow, state.date, state.providerId, item.doctorId);
    assert.ok(slots.some((slot) => !slot.available));
    assert.ok(slots.some((slot) => slot.available));
    if (item.flow === "afterHours") assert.ok(slots.every((slot) => Number(slot.time.slice(0, 2)) >= 17));
    state.time = slots.find((slot) => slot.available).time;
    assert.equal(flow.validateStep(item, state, "schedule"), "", item.name);
    assert.ok(flow.validateStep(item, { ...state, time: slots.find((slot) => !slot.available).time }, "schedule"));
    assert.ok(flow.validateStep(item, { ...state, date: "2000-01-01" }, "schedule"));
    state.notes = "Demo consultation";
    assert.equal(flow.validateStep(item, state, "person"), "");
    assert.ok(flow.validateStep(item, { ...state, phone: "bad" }, "person"));
    assert.equal(flow.getSteps(item).at(-1).id, "review");
    assert.ok(flow.selectionRows(item, state).some(([label, value]) => label === "Dịch vụ" && value === item.name));
    const changedProvider = flow.changeSelection(state, "providerId", provider.id);
    assert.equal(changedProvider.doctorId, "");
    assert.equal(changedProvider.date, "");
    assert.equal(changedProvider.time, "");
    const changedSpecialty = flow.changeSelection(state, "specialtyId", "skin");
    assert.equal(changedSpecialty.providerId, "");
    assert.equal(changedSpecialty.time, "");
    assert.equal(flow.changeSelection(state, "date", "2030-01-01").time, "");
    if (item.originalPrice) {
      assert.ok(item.price < item.originalPrice);
      assert.notEqual(item.flow, "promotion");
    }
  }
  assert.equal(catalog.getItem("missing", "missing"), undefined);
  const helper = catalog.serviceItems.find((item) => item.flow === "helper");
  assert.equal(flow.estimatedPrice(helper, { duration: "4" }), helper.price * 2);
  const business = catalog.serviceItems.find((item) => item.flow === "business");
  assert.equal(flow.estimatedPrice(business, { staff: "30" }), business.price * 30);
  const home = catalog.serviceItems.find((item) => item.flow === "home");
  const homeState = { ...flow.initialSelection(home, mockUser), providerId: home.providerIds[0] };
  assert.ok(flow.validateStep(home, homeState, "options"));
  const video = catalog.serviceItems.find((item) => item.flow === "video");
  assert.ok(flow.validateStep(video, flow.initialSelection(video, mockUser), "person"));
  console.log("PASS: 16 groups, 60 offerings, assets, associations, availability, validation, dependent resets and estimates.");
} finally {
  await server.close();
}
