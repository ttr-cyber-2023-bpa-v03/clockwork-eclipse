type LazyInitiator<T = unknown> = () => T | undefined;

class SingleSetValue<T> {
    private _isSet: boolean = false;
    public constructor(private value: T | undefined = undefined) {}

    get isSet() { return this._isSet; }

    public get() {
        return this.value;
    }

    public set(value: T | undefined): T | undefined {
        if (!this._isSet) {
            this._isSet = true;
            this.value = value;
        }
        return this.value;
    }
}

export default class Lazy<T = any> {
    private callback: LazyInitiator<T>;
    private value = new SingleSetValue<T>();

    public constructor(cb: LazyInitiator<T>) {
        this.callback = cb;
    }

    public get() {
        if (this.value.isSet)
            return this.value.get();
        return this.value.set(this.callback());
    }
}