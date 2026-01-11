import { Service } from '@/Framework/DI';

@Service('dialog-manager')
export class DialogManager
{
    public confirm(options: ConfirmOptions)
    {
        options = Object.assign({}, {
            confirmText: 'Confirm',
            cancelText:  'Cancel',
            confirmType: 'primary',
        }, options);

        return new Promise<boolean>(resolve => {
            const dialog      = document.createElement('luma-dialog');
            const message     = document.createElement('div');
            message.innerText = options.message;

            let isResolved = false;

            dialog.appendChild(message);
            dialog.label   = options.title;
            dialog.buttons = [
                {
                    type:    options.confirmType!,
                    label:   options.confirmText!,
                    onClick: () => {
                        isResolved = true;
                        resolve(true);
                    },
                },
                {
                    type:    'secondary',
                    label:   options.cancelText!,
                    onClick: () => {
                        isResolved = true;
                        resolve(false);
                    },
                },
            ];

            dialog.addEventListener('close', () => {
                if (! isResolved) resolve(null);
            });

            document.querySelector('luma-dialogs')!.appendChild(dialog);
        });
    }

    public prompt(options: ConfirmOptions & { defaultValue?: string }): Promise<string | null>
    {
        options = Object.assign({}, {
            confirmText:  'OK',
            cancelText:   'Cancel',
            confirmType:  'primary',
            defaultValue: '',
        }, options);

        return new Promise<string | null>(resolve => {
            const dialog  = document.createElement('luma-dialog');
            const message = document.createElement('div');
            const input   = document.createElement('input');

            message.innerText = options.message;
            input.type        = 'text';
            input.value       = options.defaultValue!;

            let isResolved = false;

            dialog.appendChild(message);
            dialog.appendChild(input);
            dialog.label   = options.title;
            dialog.buttons = [
                {
                    type:    options.confirmType!,
                    label:   options.confirmText!,
                    onClick: () => {
                        isResolved = true;
                        resolve(input.value);
                    },
                },
                {
                    type:    'secondary',
                    label:   options.cancelText!,
                    onClick: () => {
                        isResolved = true;
                        resolve(null);
                    },
                },
            ];

            dialog.addEventListener('close', () => {
                if (! isResolved) resolve(null);
            });

            document.querySelector('luma-dialogs')!.appendChild(dialog);

            input.addEventListener('keyup', (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    isResolved = true;
                    resolve(input.value);
                    void dialog.dispose();
                }
            });

            setTimeout(() => {
                input.focus({preventScroll: true});
            }, 250);
        });
    }
}

type ConfirmOptions = {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmType?: 'primary' | 'secondary' | 'danger';
}
