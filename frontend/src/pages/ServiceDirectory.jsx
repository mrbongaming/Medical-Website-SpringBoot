import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowUpRight, FiSearch } from "react-icons/fi";
import ServiceCard from "../components/ServiceCard";
import PageHeader from "../components/PageHeader";
import { OfferingCard, ServiceEmpty, Field } from "../components/ServiceUI";
import { serviceCatalog, getGroup, getItems, providers } from "../data/serviceCatalog";
import { normalize } from "../data/mockData";

export default function ServiceDirectory({ business = false }) {
  const { slug } = useParams();
  const groupSlug = business ? "kham-suc-khoe-doanh-nghiep" : slug;
  return <DirectoryContent key={groupSlug || "all"} groupSlug={groupSlug} />;
}
function DirectoryContent({ groupSlug }) {
  const group = getGroup(groupSlug);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [providerId, setProviderId] = useState("");
  if (groupSlug && !group) return <ServiceEmpty missing />;
  if (group?.external) return <div className="page-background">
    <PageHeader title={group.name} subtitle={group.description} />
    <div className="container panel"><p>Tiếp tục khám phá sản phẩm tại website Nhà thuốc An Khang.</p><a className="button" href={group.href} target="_blank" rel="noopener noreferrer">Đến Nhà thuốc An Khang <FiArrowUpRight /></a></div>
  </div>;
  const items = getItems(groupSlug);
  const categories = [...new Set(items.map((item) => item.category))];
  const matchingItems = items.filter((item) =>
    normalize(item.name + " " + item.category + " " + item.description).includes(normalize(query.trim())) &&
    (!category || item.category === category) && (!providerId || item.providerIds.includes(providerId))
  );
  const matchingGroups = serviceCatalog.filter((entry) => normalize(entry.name + " " + entry.description).includes(normalize(query.trim())));
  const selectableProviders = providers.filter((provider) => items.some((item) => (!category || item.category === category) && item.providerIds.includes(provider.id)));
  function reset() { setQuery(""); setCategory(""); setProviderId(""); }
  return <div className="page-background service-directory">
    <PageHeader title={group?.name || "Dịch vụ y tế"} subtitle={group?.description || "Chủ động chăm sóc sức khỏe, bắt đầu từ lựa chọn phù hợp."} />
    <div className="container">
      {group && <section className="service-intro">
        <div><span className="service-kicker">CHĂM SÓC SỨC KHỎE THEO NHU CẦU</span><h2>{group.flow === "business" ? "Một đội ngũ khỏe mạnh, một hành trình bền vững" : "Chọn dịch vụ dành cho bạn"}</h2><p>{group.description}</p><div className="service-pills"><span>{items.length} lựa chọn</span><span>Thông tin rõ ràng</span><span>Lịch linh hoạt</span></div></div>
        <img src={group.banner || group.image} alt="" />
      </section>}
      <div className="catalog-tools">
        <Field label="Tìm kiếm"><span className="catalog-search"><FiSearch /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên dịch vụ, nhu cầu..." /></span></Field>
        {group && <><Field label={group.filterLabel || "Danh mục"}><select value={category} onChange={(event) => { setCategory(event.target.value); setProviderId(""); }}><option value="">Tất cả</option>{categories.map((entry) => <option key={entry}>{entry}</option>)}</select></Field>
          <Field label="Đơn vị cung cấp"><select value={providerId} onChange={(event) => setProviderId(event.target.value)}><option value="">Tất cả cơ sở</option>{selectableProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></Field></>}
      </div>
      <div className="catalog-count"><p role="status">{group ? matchingItems.length + " dịch vụ phù hợp" : matchingGroups.length + " nhóm dịch vụ"}</p>{group && <Link to="/dich-vu-y-te">Tất cả dịch vụ →</Link>}</div>
      {group ? matchingItems.length ? <div className="offering-grid">{matchingItems.map((item) => <OfferingCard key={item.slug} item={item} />)}</div> : <ServiceEmpty onReset={reset} />
        : matchingGroups.length ? <div className="service-grid service-page-grid catalog-groups">{matchingGroups.map((entry) => <ServiceCard key={entry.slug} service={entry} />)}</div> : <ServiceEmpty onReset={reset} />}
      <p className="demo-caption">Bản trải nghiệm sử dụng dữ liệu mẫu. Thông tin và giá không phải báo giá thực tế.</p>
    </div>
  </div>;
}
