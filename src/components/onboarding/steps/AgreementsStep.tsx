import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSignature, ShieldCheck } from "lucide-react";

interface Props {
  data: any;
  setData: (patch: any) => void;
  userId: string;
}

export default function AgreementsStep({ data, setData }: Props) {
  return (
    <div className="space-y-5">
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription className="text-xs">
          You must agree to the items below before submitting your profile for verification. Your profile stays hidden from clients until our team approves it.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
          <Checkbox
            checked={!!data.consent_background_check}
            onCheckedChange={(c) => setData({ consent_background_check: !!c })}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Background check consent</p>
            <p className="text-xs text-muted-foreground">
              I authorize FundiPlug to verify my National ID, NCA, KRA PIN and any references I provide. I confirm that all documents I upload are genuine.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
          <Checkbox
            checked={!!data.consent_data_usage}
            onCheckedChange={(c) => setData({ consent_data_usage: !!c })}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Data usage & terms</p>
            <p className="text-xs text-muted-foreground">
              I consent to FundiPlug storing and processing my data to match me with clients, process payments and resolve disputes, in line with the Privacy Policy and Terms of Service.
            </p>
          </div>
        </label>
      </div>

      <div className="rounded-lg bg-muted/40 p-3 flex items-start gap-2 text-xs text-muted-foreground">
        <FileSignature className="w-4 h-4 shrink-0 mt-0.5" />
        <p>By clicking <span className="font-medium text-foreground">Submit for Verification</span> you confirm everything you have entered is true and accurate.</p>
      </div>
    </div>
  );
}
