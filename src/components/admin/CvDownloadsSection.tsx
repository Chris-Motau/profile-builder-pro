import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { SectionShell } from "@/components/admin/ui-bits";
import { db, firebaseReady } from "@/lib/firebase";

const chartConfig = {
  downloads: { label: "CV download clicks", color: "var(--chart-2)" },
};

function getMonthStarts(now: Date) {
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return Array.from(
    { length: 12 },
    (_, index) => new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1),
  );
}

export function CvDownloadsSection() {
  const [downloadDates, setDownloadDates] = useState<Timestamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const months = useMemo(() => getMonthStarts(new Date()), []);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      setUnavailable(true);
      return;
    }

    const downloadQuery = query(
      collection(db, "cvDownloads"),
      where("createdAt", ">=", Timestamp.fromDate(months[0] ?? new Date())),
      orderBy("createdAt", "asc"),
    );

    return onSnapshot(
      downloadQuery,
      (snapshot) => {
        setDownloadDates(
          snapshot.docs
            .map((download) => download.data()["createdAt"])
            .filter((date): date is Timestamp => date instanceof Timestamp),
        );
        setUnavailable(false);
        setLoading(false);
      },
      () => {
        setUnavailable(true);
        setLoading(false);
      },
    );
  }, [months]);

  const chartData = useMemo(() => {
    const counts = new Map(months.map((month) => [
      `${month.getFullYear()}-${month.getMonth()}`,
      0,
    ]));

    for (const timestamp of downloadDates) {
      const date = timestamp.toDate();
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return months.map((month) => ({
      month: month.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      downloads: counts.get(`${month.getFullYear()}-${month.getMonth()}`) ?? 0,
    }));
  }, [downloadDates, months]);

  const totalClicks = chartData.reduce((total, month) => total + month.downloads, 0);
  const currentMonthClicks = chartData.at(-1)?.downloads ?? 0;

  return (
    <SectionShell
      title="CV download interest"
      description="Clicks on the public profile’s CV link over the last 12 months."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading download counts…</p>
      ) : unavailable ? (
        <p role="status" className="text-sm text-muted-foreground">
          Download counts are unavailable. Confirm the Firestore rules are deployed and admin access is enabled.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div>
              <p className="text-2xl font-semibold tabular-nums">{totalClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{currentMonthClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </div>
          <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
            <BarChart data={chartData} accessibilityLayer margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={12}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={32}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="downloads" fill="var(--color-downloads)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <p className="text-xs text-muted-foreground">Counts are link clicks, not unique visitors or confirmed file opens.</p>
        </div>
      )}
    </SectionShell>
  );
}