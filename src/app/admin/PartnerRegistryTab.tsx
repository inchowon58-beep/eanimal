"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PET_PARTNER_TYPES } from "@/lib/pet-partner-types";

interface FeaturedPartner {
  id: string;
  name: string;
  type: string;
  address: string;
  placeUrl: string;
  imageUrl?: string;
  createdAt: string;
}

interface LookupPreview {
  name: string;
  type: string;
  address: string;
  placeUrl: string;
  imageUrl?: string;
}

export default function PartnerRegistryTab() {
  const [partners, setPartners] = useState<FeaturedPartner[]>([]);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");
  const [preview, setPreview] = useState<LookupPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPartners() {
    const res = await fetch("/api/admin/featured-partners");
    if (res.ok) setPartners(await res.json());
  }

  useEffect(() => {
    void loadPartners();
  }, []);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMessage("");
    setPreview(null);
    try {
      const res = await fetch("/api/admin/featured-partners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), region: region.trim(), type: type.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreview(data);
        setMessage("플레이스 정보를 불러왔습니다. 등록 버튼으로 메인에 노출하세요.");
      } else {
        setMessage(data.error || "업체 조회 실패");
      }
    } catch {
      setMessage("업체 조회 중 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  async function handleRegister() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/featured-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), region: region.trim(), type: type.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`"${data.name}" 업체가 등록되었습니다. 메인 학원 정보에 표시됩니다.`);
        setName("");
        setRegion("");
        setType("");
        setPreview(null);
        await loadPartners();
      } else {
        setMessage(data.error || "등록 실패");
      }
    } catch {
      setMessage("등록 중 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  async function handleRefreshImage(id: string) {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/featured-partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`"${data.name}" 이미지를 새로 가져왔습니다.`);
        await loadPartners();
      } else {
        setMessage(data.error || "이미지 새로고침 실패");
      }
    } catch {
      setMessage("이미지 새로고침 중 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 업체를 삭제하시겠습니까?")) return;
    await fetch("/api/admin/featured-partners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadPartners();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-dark mb-2">업체 등록</h2>
        <p className="text-sm text-gray-500 mb-4">
          업체명만 입력하면 네이버 플레이스에서 주소·이미지를 자동으로 가져옵니다.
          등록된 업체는 메인 페이지 <strong>학원 정보</strong> 섹션에 표시됩니다.
        </p>

        {message && (
          <p className="mb-4 text-sm text-dark bg-orange/10 p-3 rounded-xl">{message}</p>
        )}

        <form onSubmit={handlePreview} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업체명 <span className="text-orange">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: OO애견미용학원, OO애견카페"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-orange"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지역 (선택)
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 강남, 일산"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업종 (선택)
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-orange bg-white"
              >
                <option value="">자동 분류</option>
                {PET_PARTNER_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-2.5 bg-dark text-white font-bold rounded-xl hover:bg-dark-light transition disabled:opacity-50"
            >
              {loading ? "조회 중..." : "플레이스 정보 조회"}
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="px-6 py-2.5 bg-orange text-white font-bold rounded-xl hover:bg-orange-light transition disabled:opacity-50"
              >
                메인에 등록
              </button>
            )}
          </div>
        </form>

        {preview && (
          <div className="mt-6 p-4 border border-orange/30 rounded-xl bg-orange/5">
            <p className="text-xs font-bold text-orange mb-3">미리보기</p>
            <div className="flex gap-4">
              <div className="relative w-32 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {preview.imageUrl ? (
                  <Image
                    src={preview.imageUrl}
                    alt={preview.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">
                    이미지 없음
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="inline-block text-xs font-bold text-orange bg-orange/10 px-2 py-0.5 rounded-full mb-1">
                  {preview.type}
                </span>
                <p className="font-bold text-dark">{preview.name}</p>
                <p className="text-sm text-gray-600 mt-1">{preview.address}</p>
                <a
                  href={preview.placeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange hover:underline mt-1 inline-block"
                >
                  네이버 플레이스 보기
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-dark mb-4">
          등록된 업체 ({partners.length})
        </h2>
        {partners.length === 0 ? (
          <p className="text-gray-400 text-sm">등록된 업체가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex gap-4 p-4 border border-gray-100 rounded-xl"
              >
                <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {partner.imageUrl ? (
                    <Image
                      src={partner.imageUrl}
                      alt={partner.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-orange">{partner.type}</span>
                  <p className="font-medium text-dark text-sm">{partner.name}</p>
                  <p className="text-xs text-gray-500 truncate">{partner.address}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0 self-start">
                  <button
                    type="button"
                    onClick={() => handleRefreshImage(partner.id)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 border border-orange/40 text-orange rounded-lg hover:bg-orange/5"
                  >
                    이미지 새로고침
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(partner.id)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
