import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Building2 } from "lucide-react";

interface Props {
  data: any;
  setData: (patch: any) => void;
  userId: string;
}

export default function PaymentStep({ data, setData }: Props) {
  return (
    <div className="space-y-5">
      <Alert>
        <Wallet className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Earnings are paid out to your M-Pesa by default. Bank details are optional and only used for larger withdrawals.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" /> M-Pesa (required)
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>M-Pesa Number *</Label>
            <Input
              placeholder="2547XXXXXXXX"
              value={data.mpesa_number || ""}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d+]/g, "");
                setData({ mpesa_number: v });
              }}
              inputMode="tel"
            />
            <p className="text-xs text-muted-foreground">Format: 2547XXXXXXXX</p>
          </div>
          <div className="space-y-1.5">
            <Label>Registered Name *</Label>
            <Input
              placeholder="Full name on M-Pesa"
              value={data.mpesa_name || ""}
              onChange={(e) => setData({ mpesa_name: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" /> Bank (optional)
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Bank Name</Label>
            <Input
              placeholder="e.g. KCB, Equity"
              value={data.bank_name || ""}
              onChange={(e) => setData({ bank_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Account Number</Label>
            <Input
              placeholder="Bank account"
              value={data.bank_account || ""}
              onChange={(e) => setData({ bank_account: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
