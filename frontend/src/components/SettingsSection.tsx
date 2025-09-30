import { SettingsSectionProps } from '@/types/xero';

export const SettingsSection = ({ title, description, children }: SettingsSectionProps) => {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};
